import { describe, expect, it } from "vitest";
import {
	compositePlanToGuidedDraft,
	emptyGuidedCompositeDraft,
	guidedDraftToCompositeRequest,
	keyValueRecordFromEntries,
	workflowSummaryLines,
} from "./composite-guided-plan";

describe("composite-guided-plan", () => {
	it("translates a guided terraform-plus-netlab draft into the existing composite request", () => {
		const draft = emptyGuidedCompositeDraft();
		draft.name = "vpn-flow";
		draft.workflowInputs = [
			{ key: "netlab_server", value: "user:server-1" },
			{ key: "region", value: "us-east-1" },
		];
		draft.terraformTemplateSource = "blueprints";
		draft.terraformTemplatesDir = "terraform";
		draft.terraformTemplate = "CloudAWS";
		draft.terraformVars = [{ key: "environment", value: "demo" }];
		draft.terraformOutputs = ["vpn_peer_ip", "vpn_psk"];
		draft.netlabDeployment = "vpn-lab";
		draft.netlabTopologyPath = "netlab/BGP/Default-NH/topology.yml";
		draft.workflowInputBindings = [
			{ sourceInput: "region", targetKind: "terraformVar", targetKey: "region", sensitive: false },
			{ sourceInput: "netlab_server", targetKind: "netlabField", targetKey: "server", sensitive: false },
		];
		draft.terraformOutputBindings = [
			{ terraformOutput: "vpn_peer_ip", targetKind: "netlabEnv", targetKey: "VPN_PEER_IP", sensitive: false },
			{ terraformOutput: "vpn_psk", targetKind: "netlabEnv", targetKey: "VPN_PSK", sensitive: true },
		];
		draft.promotedOutputs = ["vpn_peer_ip"];

		const request = guidedDraftToCompositeRequest(draft);
		expect(request.name).toBe("vpn-flow");
		expect(request.inputs).toEqual({ netlab_server: "user:server-1", region: "us-east-1" });
		expect(request.stages).toHaveLength(2);
		expect(request.stages[0]).toMatchObject({ provider: "terraform", action: "apply" });
		expect(request.stages[0]?.inputs).toMatchObject({
			templateSource: "blueprints",
			templatesDir: "terraform",
			template: "CloudAWS",
			"env.TF_VAR_environment": "demo",
		});
		expect(request.stages[1]).toMatchObject({ provider: "netlab", action: "up" });
		expect(request.stages[1]?.inputs).toMatchObject({
			deployment: "vpn-lab",
			topologyPath: "netlab/BGP/Default-NH/topology.yml",
		});
		expect(request.bindings).toEqual([
			{
				fromStageId: "inputs",
				fromOutput: "region",
				toStageId: "tf-apply",
				toInput: "env.TF_VAR_region",
				sensitive: false,
			},
			{
				fromStageId: "inputs",
				fromOutput: "netlab_server",
				toStageId: "netlab-up",
				toInput: "server",
				sensitive: false,
			},
			{
				fromStageId: "tf-apply",
				fromOutput: "vpn_peer_ip",
				toStageId: "netlab-up",
				toInput: "env.VPN_PEER_IP",
				sensitive: false,
			},
			{
				fromStageId: "tf-apply",
				fromOutput: "vpn_psk",
				toStageId: "netlab-up",
				toInput: "env.VPN_PSK",
				sensitive: true,
			},
		]);
		expect(request.outputs).toEqual([{ stageId: "tf-apply", output: "vpn_peer_ip" }]);
	});

	it("loads a compatible generic composite plan into the guided draft model", () => {
		const compatibility = compositePlanToGuidedDraft({
			id: "plan-1",
			name: "terraform-netlab-vpn-reference",
			inputs: {
				netlab_server: "user:<server-id>",
				netlab_template: "netlab/BGP/Default-NH/topology.yml",
			},
			stages: [
				{
					id: "tf-apply",
					provider: "terraform",
					action: "apply",
					inputs: {
						target: "aws",
						templateSource: "blueprints",
						templatesDir: "terraform",
						template: "CloudAWS",
						"env.TF_VAR_region": "us-east-1",
					},
					outputs: ["vpn_peer_ip", "vpn_psk"],
				},
				{
					id: "netlab-up",
					provider: "netlab",
					action: "up",
					dependsOn: ["tf-apply"],
					inputs: {
						deployment: "vpn-lab",
						topologyPath: "netlab/BGP/Default-NH/topology.yml",
					},
				},
			],
			bindings: [
				{
					fromStageId: "inputs",
					fromOutput: "netlab_server",
					toStageId: "netlab-up",
					toInput: "server",
				},
				{
					fromStageId: "tf-apply",
					fromOutput: "vpn_peer_ip",
					toStageId: "netlab-up",
					toInput: "env.VPN_PEER_IP",
				},
			],
			outputs: [{ stageId: "tf-apply", output: "vpn_peer_ip" }],
		});

		expect(compatibility.reason).toBe("");
		expect(compatibility.guided).not.toBeNull();
		expect(compatibility.guided).toMatchObject({
			id: "plan-1",
			name: "terraform-netlab-vpn-reference",
			terraformTemplateSource: "blueprints",
			terraformTemplate: "CloudAWS",
			netlabDeployment: "vpn-lab",
		});
		expect(compatibility.guided?.workflowInputs).toEqual([
			{ key: "netlab_server", value: "user:<server-id>" },
			{ key: "netlab_template", value: "netlab/BGP/Default-NH/topology.yml" },
		]);
		expect(compatibility.guided?.workflowInputBindings).toEqual([
			{
				sourceInput: "netlab_server",
				targetKind: "netlabField",
				targetKey: "server",
				sensitive: false,
			},
		]);
		expect(compatibility.guided?.terraformOutputBindings).toEqual([
			{
				terraformOutput: "vpn_peer_ip",
				targetKind: "netlabEnv",
				targetKey: "VPN_PEER_IP",
				sensitive: false,
			},
		]);
	});

	it("rejects unsupported generic composite plans for guided mode", () => {
		const compatibility = compositePlanToGuidedDraft({
			id: "plan-2",
			name: "three-stage",
			inputs: {},
			stages: [
				{ id: "tf", provider: "terraform", action: "apply", inputs: {} },
				{ id: "bm", provider: "baremetal", action: "reserve", inputs: {} },
				{ id: "nl", provider: "netlab", action: "up", inputs: {} },
			],
			bindings: [],
			outputs: [],
		});
		expect(compatibility.guided).toBeNull();
		expect(compatibility.reason).toContain("exactly two stages");
	});

	it("summarizes workflow mappings in human-readable form", () => {
		const draft = emptyGuidedCompositeDraft();
		draft.workflowInputBindings = [
			{ sourceInput: "region", targetKind: "terraformVar", targetKey: "region", sensitive: false },
			{ sourceInput: "server", targetKind: "netlabField", targetKey: "server", sensitive: false },
		];
		draft.terraformOutputBindings = [
			{ terraformOutput: "vpn_peer_ip", targetKind: "netlabEnv", targetKey: "VPN_PEER_IP", sensitive: false },
		];
		expect(workflowSummaryLines(draft)).toEqual([
			"workflow.region -> terraform.var.region",
			"workflow.server -> netlab.server",
			"terraform.vpn_peer_ip -> netlab.env.VPN_PEER_IP",
		]);
	});

	it("normalizes key-value entries into a record", () => {
		expect(
			keyValueRecordFromEntries([
				{ key: " region ", value: " us-east-1 " },
				{ key: "", value: "skip" },
			]),
		).toEqual({ region: "us-east-1" });
	});
});

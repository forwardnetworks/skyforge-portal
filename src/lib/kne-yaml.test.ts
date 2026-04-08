import { describe, expect, it } from "vitest";
import {
	kneYamlToDesign,
	designToKneYaml,
} from "./kne-yaml";

describe("kne yaml designer model", () => {
	it("round-trips lab defaults kind and explicit link interfaces", () => {
		const source = `
name: fabric
provider: kne
nodes:
  leaf1:
    device: eos
    image: ghcr.io/example/ceos:latest
    mgmt:
      ipv4: 172.20.20.11
  spine1:
    device: eos
    image: ghcr.io/example/ceos:latest
links:
  - leaf1:
      ifname: eth1
    spine1:
      ifname: eth7
    mtu: 9000
    name: uplink
`;

		const parsed = kneYamlToDesign(source);
		expect(parsed.design.defaultKind).toBe("");
		expect(parsed.design.nodes[0]?.mgmtIpv4).toBe("172.20.20.11");
		expect(parsed.design.links[0]).toMatchObject({
			source: "leaf1",
			target: "spine1",
			sourceIf: "eth1",
			targetIf: "eth7",
			mtu: 9000,
			label: "uplink",
		});

		const rendered = designToKneYaml(parsed.design);
		expect(rendered.yaml).toContain("provider: kne");
		expect(rendered.yaml).toContain("device: eos");
		expect(rendered.yaml).toContain("leaf1:");
		expect(rendered.yaml).toContain("ifname: eth1");
		expect(rendered.yaml).toContain("spine1:");
		expect(rendered.yaml).toContain("ifname: eth7");
		expect(rendered.yaml).toContain("mtu: 9000");
	});
});

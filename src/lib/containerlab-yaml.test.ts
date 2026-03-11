import { describe, expect, it } from "vitest";
import {
	containerlabYamlToDesign,
	designToContainerlabYaml,
} from "./containerlab-yaml";

describe("containerlab yaml designer model", () => {
	it("round-trips lab defaults kind and explicit link interfaces", () => {
		const source = `
name: fabric
topology:
  defaults:
    kind: ceos
  nodes:
    leaf1:
      image: ghcr.io/example/ceos:latest
      mgmt_ipv4: 172.20.20.11
    spine1:
      image: ghcr.io/example/ceos:latest
  links:
    - endpoints:
        - leaf1:eth1
        - spine1:eth7
      mtu: 9000
      label: uplink
`;

		const parsed = containerlabYamlToDesign(source);
		expect(parsed.design.defaultKind).toBe("ceos");
		expect(parsed.design.nodes[0]?.mgmtIpv4).toBe("172.20.20.11");
		expect(parsed.design.links[0]).toMatchObject({
			source: "leaf1",
			target: "spine1",
			sourceIf: "eth1",
			targetIf: "eth7",
			mtu: 9000,
			label: "uplink",
		});

		const rendered = designToContainerlabYaml(parsed.design);
		expect(rendered.yaml).toContain("defaults:");
		expect(rendered.yaml).toContain("kind: ceos");
		expect(rendered.yaml).toContain("- leaf1:eth1");
		expect(rendered.yaml).toContain("- spine1:eth7");
		expect(rendered.yaml).toContain("mtu: 9000");
	});
});

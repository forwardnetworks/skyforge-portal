import {
	forwardDeploymentSessionHref,
	forwardNetworkSessionHref,
	forwardSnapshotSessionHref,
} from "./tool-launches";

describe("forward launch helpers", () => {
	it("prefers the network session route when a network id is available", () => {
		expect(
			forwardDeploymentSessionHref({
				networkID: "326",
				snapshotURL:
					"https://fwd-appserver.forward.svc:8443/api/networks/326/performance/raw-data?snapshotId=328",
			}),
		).toBe(
			forwardNetworkSessionHref("326"),
		);
	});

	it("falls back to the snapshot path when a network id is not available", () => {
		expect(
			forwardDeploymentSessionHref({
				snapshotURL:
					"https://fwd-appserver.forward.svc:8443/api/networks/326/performance/raw-data?snapshotId=328",
			}),
		).toBe(
			forwardNetworkSessionHref("326"),
		);
	});

	it("uses the network session route when no snapshot is present", () => {
		expect(forwardDeploymentSessionHref({ networkID: "326" })).toBe(
			forwardNetworkSessionHref("326"),
		);
	});

	it("ignores invalid snapshot values", () => {
		expect(forwardSnapshotSessionHref("network-326")).toBe("");
	});

	it("falls back to the snapshot session only when no network id can be derived", () => {
		expect(
			forwardDeploymentSessionHref({
				snapshotURL: "https://fwd-appserver.forward.svc:8443/search?networkId=326",
			}),
		).toBe(
			forwardSnapshotSessionHref(
				"https://fwd-appserver.forward.svc:8443/search?networkId=326",
			),
		);
	});
});

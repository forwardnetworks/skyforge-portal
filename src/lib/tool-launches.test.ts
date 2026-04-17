import {
	forwardDeploymentSessionHref,
	forwardNetworkSessionHref,
	forwardSnapshotSessionHref,
} from "./tool-launches";

describe("forward launch helpers", () => {
	it("prefers the snapshot path when one is available", () => {
		expect(
			forwardDeploymentSessionHref({
				networkID: "326",
				snapshotURL:
					"https://fwd-appserver.forward.svc:8443/api/networks/326/performance/raw-data?snapshotId=328",
			}),
		).toBe(
			"/api/forward/session?next=%2Fapi%2Fnetworks%2F326%2Fperformance%2Fraw-data%3FsnapshotId%3D328",
		);
	});

	it("falls back to the network session route when no snapshot is present", () => {
		expect(forwardDeploymentSessionHref({ networkID: "326" })).toBe(
			forwardNetworkSessionHref("326"),
		);
	});

	it("ignores invalid snapshot values", () => {
		expect(forwardSnapshotSessionHref("network-326")).toBe("");
	});
});

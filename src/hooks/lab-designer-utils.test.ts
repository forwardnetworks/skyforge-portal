import {
	hostLabelFromURL,
	imageDisplayName,
	imageIsRepoOnly,
	imageRefParts,
	resolveRepoTag,
	resolveTopologyImageTags,
} from "@/hooks/lab-designer-utils";
import { queryKeys } from "@/lib/query-keys";
import { describe, expect, it, vi } from "vitest";

describe("lab-designer-utils", () => {
	it("extracts host labels from URLs", () => {
		expect(hostLabelFromURL("https://example.net/path")).toBe("example.net");
		expect(hostLabelFromURL("example.net/foo")).toBe("example.net");
	});

	it("parses image refs with repo, tag, and digest", () => {
		expect(imageRefParts("ghcr.io/org/repo:1.2.3")).toEqual({
			repo: "ghcr.io/org/repo",
			tag: "1.2.3",
			digest: "",
		});
		expect(imageRefParts("ghcr.io:443/org/repo")).toEqual({
			repo: "ghcr.io:443/org/repo",
			tag: "",
			digest: "",
		});
		expect(imageRefParts("ghcr.io/org/repo@sha256:abc")).toEqual({
			repo: "ghcr.io/org/repo",
			tag: "",
			digest: "sha256:abc",
		});
	});

	it("formats short image display names", () => {
		expect(imageDisplayName("ghcr.io/forwardnetworks/kne/ceos:4.34.2F")).toBe(
			"ceos:4.34.2F",
		);
		expect(imageDisplayName("ghcr.io/forwardnetworks/kne/ceos")).toBe("ceos");
		expect(imageDisplayName("ghcr.io/example/repo@sha256:abc")).toBe(
			"repo@sha256:abc",
		);
	});

	it("detects repo-only image references", () => {
		expect(imageIsRepoOnly("ghcr.io/org/repo")).toBe(true);
		expect(imageIsRepoOnly("ghcr.io/org/repo:latest")).toBe(false);
		expect(imageIsRepoOnly("ghcr.io/org/repo@sha256:abc")).toBe(false);
	});

	it("resolves repo tag from registry tag list", async () => {
		const fetchQuery = vi.fn().mockResolvedValue({ tags: ["1.0.0", "latest"] });
		const queryClient = { fetchQuery } as any;
		const tag = await resolveRepoTag({
			repo: "ghcr.io/org/repo",
			queryClient,
			fallbackTag: "fallback",
		});
		expect(tag).toBe("latest");
		expect(fetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: queryKeys.registryTags("ghcr.io/org/repo", ""),
			}),
		);
	});

	it("falls back when tag lookup fails", async () => {
		const queryClient = {
			fetchQuery: vi.fn().mockRejectedValue(new Error("boom")),
		} as any;
		await expect(
			resolveRepoTag({
				repo: "ghcr.io/org/repo",
				queryClient,
				fallbackTag: "pinned",
			}),
		).resolves.toBe("pinned");
	});

	it("resolves repo-only topology images to tagged refs", async () => {
		const queryClient = {
			fetchQuery: vi.fn().mockResolvedValue({ tags: ["20260301", "latest"] }),
		} as any;
		const input = `
name: demo
nodes:
  r1:
    vendor: arista
    model: ceos
    runtime: containerlab
    config:
      image: ghcr.io/forwardnetworks/kne/ceos
  r2:
    vendor: linux
    model: linux
    runtime: containerlab
    config:
      image: ghcr.io/forwardnetworks/kne/linux:20260323
`;
		const out = await resolveTopologyImageTags({
			topologyYAML: input,
			queryClient,
			fallbackTagByRepo: {
				"ghcr.io/forwardnetworks/kne/ceos": "4.34.2F",
			},
		});
		expect(out.updatedImages).toEqual([
			{
				nodeName: "r1",
				image: "ghcr.io/forwardnetworks/kne/ceos:latest",
			},
		]);
		expect(out.topologyYAML).toContain(
			"image: ghcr.io/forwardnetworks/kne/ceos:latest",
		);
		expect(out.topologyYAML).toContain(
			"image: ghcr.io/forwardnetworks/kne/linux:20260323",
		);
	});
});

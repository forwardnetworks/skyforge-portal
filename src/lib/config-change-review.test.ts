import { describe, expect, it } from "vitest";
import {
	reviewArtifactRefsFromJSON,
	reviewExecutionBackendFromJSON,
} from "./config-change-review";

describe("config-change-review helpers", () => {
	it("extracts artifact refs from review json", () => {
		const refs = reviewArtifactRefsFromJSON(
			'{"artifactRefs":[{"kind":"forward-auto-rollback","key":"requested;eligibility=eligible"}]}',
		);
		expect(refs).toHaveLength(1);
		expect(refs[0]?.kind).toBe("forward-auto-rollback");
	});

	it("returns empty refs for invalid review json", () => {
		expect(reviewArtifactRefsFromJSON("{invalid")).toEqual([]);
	});

	it("extracts normalized execution backend from review json", () => {
		expect(
			reviewExecutionBackendFromJSON('{"executionBackend":"Ansible-Push"}'),
		).toBe("ansible-push");
	});
});

import { describe, expect, it } from "vitest";
import type { SkyforgeUserScope } from "../lib/api-client";
import { pickPreferredUserScopeID } from "./deployments-page-utils";

function scope(id: string, slug: string, createdBy = "other"): SkyforgeUserScope {
	return {
		id,
		slug,
		name: slug,
		description: "",
		createdAt: "",
		createdBy,
		blueprint: "",
		defaultBranch: "",
		terraformStateKey: "",
		terraformInitTemplateId: 0,
		terraformPlanTemplateId: 0,
		terraformApplyTemplateId: 0,
		ansibleRunTemplateId: 0,
		netlabRunTemplateId: 0,
		awsAccountId: "",
		awsRoleName: "",
		awsRegion: "",
		awsAuthMethod: "",
		artifactsBucket: "",
		isPublic: false,
		owners: [],
		editors: [],
		viewers: [],
		ownerGroups: [],
		editorGroups: [],
		viewerGroups: [],
		netlabServer: "",
		allowExternalTemplateRepos: false,
		allowCustomNetlabServers: false,
		externalTemplateRepos: [],
		giteaOwner: "",
		giteaRepo: "",
	};
}

describe("pickPreferredUserScopeID", () => {
	it("uses requested scope when valid", () => {
		const scopes = [scope("u-1", "alpha"), scope("u-2", "beta")];
		expect(
			pickPreferredUserScopeID({
				userScopes: scopes,
				effectiveUsername: "craigjohnson",
				isAdmin: true,
				requestedUserScopeID: "u-2",
				storedUserScopeID: "u-1",
			}),
		).toBe("u-2");
	});

	it("prefers admin own scope before stored/alphabetical", () => {
		const scopes = [
			scope("u-1", "aaa", "someoneelse"),
			scope("u-2", "craigjohnson", "craigjohnson"),
			scope("u-3", "zzz", "someoneelse"),
		];
		expect(
			pickPreferredUserScopeID({
				userScopes: scopes,
				effectiveUsername: "craigjohnson",
				isAdmin: true,
				storedUserScopeID: "u-1",
			}),
		).toBe("u-2");
	});

	it("uses stored scope when admin own scope is unavailable", () => {
		const scopes = [scope("u-1", "alpha"), scope("u-2", "beta")];
		expect(
			pickPreferredUserScopeID({
				userScopes: scopes,
				effectiveUsername: "craigjohnson",
				isAdmin: true,
				storedUserScopeID: "u-2",
			}),
		).toBe("u-2");
	});

	it("falls back to first visible scope", () => {
		const scopes = [scope("u-9", "alpha"), scope("u-10", "beta")];
		expect(
			pickPreferredUserScopeID({
				userScopes: scopes,
				effectiveUsername: "craigjohnson",
				isAdmin: false,
			}),
		).toBe("u-9");
	});
});

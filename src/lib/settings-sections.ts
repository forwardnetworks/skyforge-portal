export const settingsSections = [
	{
		id: "profile",
		label: "Profile",
		description:
			"Personal defaults, API tokens, template repos, and bring-your-own-lab credentials.",
		adminOnly: false,
	},
	{
		id: "identity",
		label: "Access & Identity",
		description:
			"Authentication mode, OIDC, and operator impersonation controls.",
		adminOnly: true,
	},
	{
		id: "integrations",
		label: "Integrations",
		description: "Shared integrations such as Teams and ServiceNow.",
		adminOnly: true,
	},
	{
		id: "forward",
		label: "Forward",
		description:
			"Forward-specific credentials, demo data, and quick-deploy catalog settings.",
		adminOnly: true,
	},
	{
		id: "runtime",
		label: "Runtime & Capacity",
		description:
			"Burst capacity, runtime pressure, and access surfaces that affect the live platform.",
		adminOnly: true,
	},
	{
		id: "users",
		label: "Users & Permissions",
		description:
			"Managed users, RBAC, API overrides, policy assignment, and tenant reset actions.",
		adminOnly: true,
	},
	{
		id: "maintenance",
		label: "Audit & Maintenance",
		description:
			"Audit log, effective config, reconciliation, and cleanup operations.",
		adminOnly: true,
	},
] as const;

export type SettingsSectionId = (typeof settingsSections)[number]["id"];
export type LegacySettingsTab = "profile" | "admin";
export type SettingsSectionDefinition = (typeof settingsSections)[number];

export function getAvailableSettingsSections(
	canAccessAdminSections: boolean,
): SettingsSectionDefinition[] {
	return settingsSections.filter(
		(section) => canAccessAdminSections || !section.adminOnly,
	);
}

export function getDefaultSettingsSection(
	canAccessAdminSections: boolean,
): SettingsSectionId {
	return canAccessAdminSections ? "profile" : "profile";
}

export function normalizeSettingsSection(args: {
	section?: SettingsSectionId;
	legacyTab?: LegacySettingsTab;
	canAccessAdminSections: boolean;
}): SettingsSectionId {
	const { section, legacyTab, canAccessAdminSections } = args;
	if (section) {
		const matched = settingsSections.find((entry) => entry.id === section);
		if (matched && (!matched.adminOnly || canAccessAdminSections)) {
			return matched.id;
		}
	}
	if (legacyTab === "admin" && canAccessAdminSections) {
		return "users";
	}
	return getDefaultSettingsSection(canAccessAdminSections);
}

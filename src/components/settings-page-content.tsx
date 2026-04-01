import { renderAdminSettingsSection } from "./settings-admin-sections";
import type { SettingsAdminSectionProps } from "./settings-section-types";
import type { UserSettingsPageState } from "./user-settings-types";
import { UserSettingsContent } from "./user-settings-content";
import type {
	SettingsSectionDefinition,
	SettingsSectionId,
} from "../lib/settings-sections";

export function SettingsSectionContent(props: {
	section: SettingsSectionId;
	sectionDefinition: SettingsSectionDefinition;
	userPage: UserSettingsPageState;
	adminProps?: SettingsAdminSectionProps;
}) {
	const { section, sectionDefinition, userPage, adminProps } = props;

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					{sectionDefinition.label}
				</h1>
				<p className="text-sm text-muted-foreground">
					{sectionDefinition.description}
				</p>
			</div>
			{section === "profile"
				? <UserSettingsContent page={userPage} />
				: adminProps
					? renderAdminSettingsSection(section, adminProps)
					: null}
		</div>
	);
}

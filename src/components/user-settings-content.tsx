import { UserSettingsAPITokensCard } from "./user-settings-api-tokens-card";
import { UserSettingsByolServersCard } from "./user-settings-byol-servers-card";
import { UserSettingsCloudCredentialsCard } from "./user-settings-cloud-credentials-card";
import { UserSettingsTemplateReposForm } from "./user-settings-template-repos-form";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsContent(props: { page: UserSettingsPageState }) {
	const { page } = props;

	return (
		<>
			<UserSettingsAPITokensCard page={page} />
			<UserSettingsTemplateReposForm page={page} />
			<UserSettingsCloudCredentialsCard page={page} />
			<UserSettingsByolServersCard page={page} />
		</>
	);
}

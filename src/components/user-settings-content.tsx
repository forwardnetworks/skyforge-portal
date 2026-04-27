import { UserSettingsAPITokensCard } from "./user-settings-api-tokens-card";
import { UserSettingsByolServersCard } from "./user-settings-byol-servers-card";
import { UserSettingsCloudCredentialsCard } from "./user-settings-cloud-credentials-card";
import { UserSettingsPlatformPolicyCard } from "./user-settings-platform-policy-card";
import { UserSettingsSshKeysCard } from "./user-settings-ssh-keys-card";
import { UserSettingsTemplateReposForm } from "./user-settings-template-repos-form";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsContent(props: { page: UserSettingsPageState }) {
	const { page } = props;

	return (
		<>
			<UserSettingsPlatformPolicyCard page={page} />
			<UserSettingsAPITokensCard page={page} />
			<UserSettingsSshKeysCard page={page} />
			<UserSettingsTemplateReposForm page={page} />
			<UserSettingsCloudCredentialsCard page={page} />
			<UserSettingsByolServersCard page={page} />
		</>
	);
}

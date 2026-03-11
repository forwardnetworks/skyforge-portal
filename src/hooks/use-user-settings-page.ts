import { useUserSettingsApiTokens } from "./use-user-settings-api-tokens";
import { useUserSettingsByolServers } from "./use-user-settings-byol-servers";
import { useUserSettingsCloudCredentials } from "./use-user-settings-cloud-credentials";
import {
	type UserSettingsFormValues,
	useUserSettingsForm,
	userSettingsFormSchema,
} from "./use-user-settings-form";

export { userSettingsFormSchema };
export type { UserSettingsFormValues };

export function useUserSettingsPage() {
	const settingsForm = useUserSettingsForm();
	const apiTokens = useUserSettingsApiTokens();
	const cloudCredentials = useUserSettingsCloudCredentials();
	const byolServers = useUserSettingsByolServers();

	return {
		...settingsForm,
		...apiTokens,
		...cloudCredentials,
		...byolServers,
	};
}

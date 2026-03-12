import { useQuery } from "@tanstack/react-query";
import { getCurrentPlatformPolicy } from "../lib/api-client-platform";
import { queryKeys } from "../lib/query-keys";
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
	const currentPlatformPolicyQ = useQuery({
		queryKey: queryKeys.currentPlatformPolicy(),
		queryFn: getCurrentPlatformPolicy,
		staleTime: 15_000,
		retry: false,
	});
	const settingsForm = useUserSettingsForm();
	const apiTokens = useUserSettingsApiTokens();
	const cloudCredentials = useUserSettingsCloudCredentials();
	const byolServers = useUserSettingsByolServers();

	return {
		currentPlatformPolicyQ,
		...settingsForm,
		...apiTokens,
		...cloudCredentials,
		...byolServers,
	};
}

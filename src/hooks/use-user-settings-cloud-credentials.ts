import { useUserSettingsAwsCredentials } from "./use-user-settings-aws-credentials";
import { useUserSettingsMultiCloudCredentials } from "./use-user-settings-multi-cloud-credentials";

export function useUserSettingsCloudCredentials() {
	const aws = useUserSettingsAwsCredentials();
	const multiCloud = useUserSettingsMultiCloudCredentials();

	return {
		...aws,
		...multiCloud,
	};
}

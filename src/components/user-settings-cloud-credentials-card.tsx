import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { UserSettingsAwsSsoCredentialsCard } from "./user-settings-aws-sso-credentials-card";
import { UserSettingsAwsStaticCredentialsCard } from "./user-settings-aws-static-credentials-card";
import { UserSettingsAzureCredentialsCard } from "./user-settings-azure-credentials-card";
import { UserSettingsGcpCredentialsCard } from "./user-settings-gcp-credentials-card";
import { UserSettingsIbmCredentialsCard } from "./user-settings-ibm-credentials-card";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsCloudCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Cloud Credentials</CardTitle>
			</CardHeader>
			<CardContent className="space-y-8">
				<div className="grid gap-6 md:grid-cols-2">
					<UserSettingsAwsStaticCredentialsCard page={page} />
					<UserSettingsAwsSsoCredentialsCard page={page} />
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					<UserSettingsAzureCredentialsCard page={page} />
					<UserSettingsGcpCredentialsCard page={page} />
					<UserSettingsIbmCredentialsCard page={page} />
				</div>
			</CardContent>
		</Card>
	);
}

import {
	isInClusterCollectorBaseURL,
	stripForwardCredentialProtocol,
	type useForwardCredentialsPage,
} from "@/hooks/use-forward-credentials-page";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { ForwardCredentialsSavedCredentialRow } from "./forward-credentials-saved-credential-row";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

export function ForwardCredentialsSavedCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Saved Credential Sets</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{page.collectorsQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : null}
				{page.collectorsQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load credential sets.
					</div>
				) : null}
				{!page.collectorsQ.isLoading && page.credentialSets.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No credential sets saved.
					</div>
				) : null}

				{page.credentialSets.map((credential) => {
					const baseUrl = (credential.baseUrl || "").trim();
					const inClusterManaged = isInClusterCollectorBaseURL(baseUrl);
					const key =
						`${(credential.username || "").trim()}@${stripForwardCredentialProtocol(baseUrl)}`.replace(
							/@$/,
							"",
						);
					return (
						<ForwardCredentialsSavedCredentialRow
							key={credential.id}
							page={page}
							credential={credential}
							inClusterManaged={inClusterManaged}
							displayLabel={key || credential.name || credential.id}
						/>
					);
				})}
			</CardContent>
		</Card>
	);
}

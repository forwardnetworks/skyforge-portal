import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { Button } from "./ui/button";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;
type ForwardCredentialsSavedCredential = ForwardCredentialsPageState["credentialSets"][number];

type ForwardCredentialsSavedCredentialRowProps = {
	page: ForwardCredentialsPageState;
	credential: ForwardCredentialsSavedCredential;
	inClusterManaged: boolean;
	displayLabel: string;
};

export function ForwardCredentialsSavedCredentialRow(
	props: ForwardCredentialsSavedCredentialRowProps,
) {
	const { page, credential, inClusterManaged, displayLabel } = props;
	return (
		<div className="flex items-center justify-between gap-3 rounded border p-3">
			<div className="min-w-0">
				<div className="truncate text-sm font-medium">
					{displayLabel}
				</div>
				<div className="truncate font-mono text-xs text-muted-foreground">
					{credential.baseUrl}
				</div>
				{inClusterManaged ? (
					<div className="text-xs text-muted-foreground">
						Managed automatically from your Forward org API token.
					</div>
				) : null}
			</div>
			<Button
				variant="destructive"
				size="sm"
				onClick={() => page.deleteMutation.mutate(String(credential.id))}
				disabled={page.deleteMutation.isPending || inClusterManaged}
			>
				{inClusterManaged ? "Managed" : "Delete"}
			</Button>
		</div>
	);
}

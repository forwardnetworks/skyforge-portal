import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type AdminAuthSettingsResponse,
	putAdminAuthSettings,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthLocalArgs = {
	queryClient: QueryClient;
	authSettings: AdminAuthSettingsResponse | undefined;
	refetchAuthSettings: () => Promise<unknown>;
};

export function useAdminSettingsAuthLocal({
	queryClient,
	authSettings,
	refetchAuthSettings,
}: UseAdminSettingsAuthLocalArgs) {
	const [authProviderDraft, setAuthProviderDraft] = useState<"local" | "okta">(
		"local",
	);
	const [breakGlassEnabledDraft, setBreakGlassEnabledDraft] = useState(false);
	const [breakGlassLabelDraft, setBreakGlassLabelDraft] = useState(
		"Emergency local login",
	);

	useEffect(() => {
		const provider = String(authSettings?.primaryProvider ?? "")
			.trim()
			.toLowerCase();
		if (provider === "okta" || provider === "local") {
			setAuthProviderDraft(provider);
		}
		setBreakGlassEnabledDraft(Boolean(authSettings?.breakGlassEnabled));
		setBreakGlassLabelDraft(
			String(authSettings?.breakGlassLabel ?? "Emergency local login"),
		);
	}, [
		authSettings?.primaryProvider,
		authSettings?.breakGlassEnabled,
		authSettings?.breakGlassLabel,
	]);

	const saveAuthSettings = useMutation({
		mutationFn: async () =>
			putAdminAuthSettings({
				primaryProvider: authProviderDraft,
				breakGlassEnabled: breakGlassEnabledDraft,
				breakGlassLabel: breakGlassLabelDraft.trim() || "Emergency local login",
			}),
		onSuccess: async (res) => {
			const nextMode = String(res.primaryProvider ?? "local");
			toast.success("Authentication mode updated", {
				description: `Primary provider: ${nextMode}`,
			});
			await Promise.all([
				refetchAuthSettings(),
				queryClient.invalidateQueries({ queryKey: queryKeys.uiConfig() }),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update authentication mode", {
				description: (e as Error).message,
			});
		},
	});

	return {
		authProviderDraft,
		setAuthProviderDraft,
		breakGlassEnabledDraft,
		setBreakGlassEnabledDraft,
		breakGlassLabelDraft,
		setBreakGlassLabelDraft,
		saveAuthSettings,
	};
}

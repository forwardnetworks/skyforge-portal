import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SKYFORGE_API } from "@/lib/skyforge-config";
import { queryKeys } from "@/lib/query-keys";
import { disconnectUserGemini, getUserGeminiConfig } from "@/lib/skyforge-api";

export const Route = createFileRoute("/dashboard/gemini")({
	component: GeminiPage,
});

function GeminiPage() {
	const qc = useQueryClient();
	const cfgKey = queryKeys.userGeminiConfig();

	const cfg = useQuery({
		queryKey: cfgKey,
		queryFn: getUserGeminiConfig,
		refetchInterval: 10_000,
	});

	const disconnect = useMutation({
		mutationFn: async () => disconnectUserGemini(),
		onSuccess: async () => {
			toast.success("Disconnected Gemini");
			await qc.invalidateQueries({ queryKey: cfgKey });
		},
		onError: (e) => {
			toast.error("Failed to disconnect Gemini", {
				description: e instanceof Error ? e.message : String(e),
			});
		},
	});

	const enabled = cfg.data?.enabled ?? false;
	const configured = cfg.data?.configured ?? false;

	return (
		<div className="mx-auto w-full max-w-3xl space-y-4 p-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Gemini</h1>
					<p className="text-sm text-muted-foreground">
						Connect your Google account so Skyforge can call Gemini/Vertex on your
						behalf (future workflows: template generation, validation helpers).
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Connection</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{cfg.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : !enabled ? (
						<div className="text-sm text-muted-foreground">
							Gemini integration is disabled on this Skyforge instance.
						</div>
					) : (
						<>
							<div className="grid gap-2 text-sm">
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground">Status</span>
									<span>{configured ? "Connected" : "Not connected"}</span>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground">Email</span>
									<span>{cfg.data?.email ?? "—"}</span>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground">Scopes</span>
									<span className="truncate">{cfg.data?.scopes ?? "—"}</span>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground">Updated</span>
									<span>{cfg.data?.updatedAt ?? "—"}</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									disabled={!enabled}
									onClick={() => {
										window.location.assign(
											`${SKYFORGE_API}/user/integrations/gemini/connect`,
										);
									}}
								>
									{configured ? "Reconnect" : "Connect"}
								</Button>
								<Button
									variant="secondary"
									disabled={!configured || disconnect.isPending}
									onClick={() => disconnect.mutate()}
								>
									Disconnect
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Redirect URL (configure this in your Google Cloud OAuth client):{" "}
								<span className="font-mono">{cfg.data?.redirectUrl ?? "—"}</span>
							</p>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}


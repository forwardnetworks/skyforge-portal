import type { TeamsPageData } from "../hooks/use-teams-page";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

export function TeamsPageContent({ page }: { page: TeamsPageData }) {
	const {
		cfgQ,
		collectorOptions,
		networkOptions,
		selectedUserScopeId,
		networksQ,
		enabled,
		setEnabled,
		teamsUserRef,
		setTeamsUserRef,
		outboundWebhookURL,
		setOutboundWebhookURL,
		forwardCredentialSetId,
		setForwardCredentialSetId,
		defaultNetworkId,
		setDefaultNetworkId,
		saveMutation,
		testMutation,
	} = page;

	const cfg = cfgQ.data;

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Teams</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Skyforge-managed Teams bridge for Forward path search and workflow
					messaging.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Bridge Binding</CardTitle>
					<CardDescription>
						Bind your Teams identity, outbound webhook, Forward credential set,
						and default network.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between rounded-md border p-3">
						<div>
							<div className="font-medium">Enable Teams bridge for this user</div>
							<div className="text-xs text-muted-foreground">
								When enabled, Skyforge can map incoming Teams bridge events to
								your Forward context.
							</div>
						</div>
						<Switch checked={enabled} onCheckedChange={setEnabled} />
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Teams user reference</Label>
							<Input
								value={teamsUserRef}
								onChange={(e) => setTeamsUserRef(e.target.value)}
								placeholder="user@forwardnetworks.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>Outbound webhook URL</Label>
							<Input
								value={outboundWebhookURL}
								onChange={(e) => setOutboundWebhookURL(e.target.value)}
								placeholder="https://example.test/webhook"
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward credential set</Label>
							<Select
								value={forwardCredentialSetId || ""}
								onValueChange={setForwardCredentialSetId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select saved credential set" />
								</SelectTrigger>
								<SelectContent>
									{collectorOptions.map((collector) => (
										<SelectItem key={collector.id} value={collector.id}>
											{collector.name}
											{collector.isDefault ? " (default)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Default Forward network</Label>
							<Select
								value={defaultNetworkId || ""}
								onValueChange={setDefaultNetworkId}
								disabled={!selectedUserScopeId || networksQ.isLoading}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select saved Forward network" />
								</SelectTrigger>
								<SelectContent>
									{networkOptions.map((network) => (
										<SelectItem
											key={network.id}
											value={network.forwardNetworkId}
										>
											{network.name} ({network.forwardNetworkId})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<div className="text-xs text-muted-foreground">
								Uses the saved Forward networks for your current user scope.
							</div>
						</div>
					</div>
					<div className="text-xs text-muted-foreground space-y-1">
						<div>
							Global status:{" "}
							{cfg?.globalConfigured ? "configured" : "not configured by admin"}
						</div>
						<div>
							Scope status:{" "}
							{selectedUserScopeId
								? `${networkOptions.length} saved network${networkOptions.length === 1 ? "" : "s"}`
								: "no user scope available"}
						</div>
						{cfg?.displayName ? <div>Tenant: {cfg.displayName}</div> : null}
						{cfg?.callbackUrl ? (
							<div>
								Callback URL: <code>{cfg.callbackUrl}</code>
							</div>
						) : null}
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							onClick={() => saveMutation.mutate()}
							disabled={saveMutation.isPending}
						>
							Save Teams binding
						</Button>
						<Button
							variant="secondary"
							onClick={() => testMutation.mutate()}
							disabled={testMutation.isPending}
						>
							Send test message
						</Button>
						<Button
							variant="outline"
							onClick={() => void cfgQ.refetch()}
							disabled={cfgQ.isFetching}
						>
							Reload
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Command Contract</CardTitle>
					<CardDescription>
						Inbound bridge commands are narrow and map to Forward APIs on your
						behalf.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<div>
						<code>help</code> - show usage
					</div>
					<div>
						<code>path &lt;srcIp&gt; &lt;dstIp&gt;</code> - run a path search on
						your configured network
					</div>
					<div className="text-xs text-muted-foreground">
						Optional key/value arguments: <code>from=</code>, <code>dport=</code>
						, <code>sport=</code>, <code>proto=</code>, <code>intent=</code>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

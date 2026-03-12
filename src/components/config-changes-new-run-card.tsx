import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
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
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { configChangeSourceOptions } from "./config-changes-shared";

export function ConfigChangesNewRunCard({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const {
		targetType,
		setTargetType,
		targetRef,
		setTargetRef,
		targetName,
		setTargetName,
		sourceKind,
		setSourceKind,
		executionMode,
		setExecutionMode,
		summary,
		setSummary,
		ticketRef,
		setTicketRef,
		specJson,
		setSpecJson,
		createMutation,
	} = page;
	const selectedSource =
		configChangeSourceOptions.find((item) => item.value === sourceKind) ??
		configChangeSourceOptions[0];
	const executablePath = targetType === "deployment" && selectedSource.executable;

	return (
		<Card>
			<CardHeader>
				<CardTitle>New Change Run</CardTitle>
				<CardDescription>
					Create a durable change request using the same control-plane model
					that hands off into the existing netlab apply seam.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<div className="space-y-2">
						<Label>Target type</Label>
						<Select value={targetType} onValueChange={setTargetType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="snapshot">Snapshot</SelectItem>
								<SelectItem value="deployment">Deployment</SelectItem>
								<SelectItem value="environment">Environment</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Target ref</Label>
						<Input
							value={targetRef}
							onChange={(e) => setTargetRef(e.target.value)}
							placeholder="deployment-id"
						/>
					</div>
					<div className="space-y-2">
						<Label>Target name</Label>
						<Input
							value={targetName}
							onChange={(e) => setTargetName(e.target.value)}
							placeholder="Marketing Snapshot Deployment"
						/>
					</div>
				<div className="space-y-2">
					<Label>Source kind</Label>
						<Select value={sourceKind} onValueChange={setSourceKind}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{configChangeSourceOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Execution mode</Label>
						<Select value={executionMode} onValueChange={setExecutionMode}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="dry-run">Dry Run</SelectItem>
								<SelectItem value="staged">Staged</SelectItem>
								<SelectItem value="apply">Apply</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Ticket reference</Label>
						<Input
							value={ticketRef}
							onChange={(e) => setTicketRef(e.target.value)}
							placeholder="JIRA-1234"
						/>
					</div>
				</div>
				<div className="space-y-2">
					<Label>Summary</Label>
					<Input
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						placeholder="Allow ACL for demo path"
					/>
				</div>
				<div className="space-y-2">
					<Label>Spec JSON</Label>
					<Textarea
						value={specJson}
						onChange={(e) => setSpecJson(e.target.value)}
						rows={10}
						spellCheck={false}
						className="font-mono text-xs"
					/>
				</div>
				<div className="rounded-md border p-3 text-sm space-y-2">
					<div className="flex items-center gap-2">
						<div className="font-medium">{selectedSource.label}</div>
						<Badge variant={executablePath ? "default" : "outline"}>
							{executablePath ? "Executable Path" : "Review Only"}
						</Badge>
					</div>
					<div className="text-muted-foreground">{selectedSource.description}</div>
					{targetType !== "deployment" ? (
						<div className="text-muted-foreground">
							Only deployment targets are executable today. Snapshot and
							environment targets stay in review-only mode.
						</div>
					) : null}
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => createMutation.mutate()}
						disabled={createMutation.isPending}
					>
						Create change run
					</Button>
					<div className="text-xs text-muted-foreground">
						Render/review is live. Approval and apply stay behind the protected
						operator flow.
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

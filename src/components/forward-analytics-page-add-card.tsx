import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import type { ForwardAnalyticsPageContentProps } from "./forward-analytics-page-shared";

export function ForwardAnalyticsPageAddCard({
	page,
}: ForwardAnalyticsPageContentProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Forward network</CardTitle>
				<CardDescription>
					These networks are used as the scope for capacity rollups and live perf
					drilldowns.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Name</Label>
						<Input
							value={page.name}
							onChange={(e) => page.setName(e.target.value)}
							placeholder="prod-edge"
						/>
					</div>
					<div className="space-y-2">
						<Label>Forward Network ID</Label>
						<Input
							value={page.forwardNetworkId}
							onChange={(e) => page.setForwardNetworkId(e.target.value)}
							placeholder="abc123..."
						/>
					</div>
				</div>
				<div className="space-y-2">
					<Label>Description (optional)</Label>
					<Input
						value={page.description}
						onChange={(e) => page.setDescription(e.target.value)}
						placeholder="Notes for humans"
					/>
				</div>
				<div className="space-y-2">
					<Label>Forward collector config (optional)</Label>
					<Select
						value={page.collectorConfigId}
						onValueChange={page.setCollectorConfigId}
					>
						<SelectTrigger>
							<SelectValue placeholder="Use my default Forward config" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__default__">Use my default</SelectItem>
							{page.collectors.map((collector) => (
								<SelectItem
									key={String(collector.id)}
									value={String(collector.id)}
								>
									{String(collector.name ?? collector.id)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => page.createM.mutate()}
						disabled={!page.selectedUserScopeId || page.createM.isPending}
					>
						<Plus className="mr-2 h-4 w-4" />
						Save network
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

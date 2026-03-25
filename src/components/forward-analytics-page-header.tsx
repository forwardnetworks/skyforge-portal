import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import type { ForwardAnalyticsPageContentProps } from "./forward-analytics-page-shared";
import { userScopeLabel } from "./forward-analytics-page-shared";

export function ForwardAnalyticsPageHeader({
	page,
}: ForwardAnalyticsPageContentProps) {
	return (
		<div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Forward Analytics</h1>
				<p className="text-muted-foreground text-sm">
					Save one or more Forward networks per user scope, then open Network
					Insights views against them.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
					<Select
						value={page.selectedUserScopeId || "__none__"}
						onValueChange={page.handleUserScopeChange}
					>
						<SelectTrigger className="h-8 w-[240px] border-0 bg-transparent shadow-none focus:ring-0">
							<SelectValue placeholder="Select user scope" />
						</SelectTrigger>
						<SelectContent>
							{page.userScopes.map((scope) => (
								<SelectItem key={scope.id} value={scope.id}>
									{userScopeLabel(scope)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8"
					disabled={!page.selectedUserScopeId}
					onClick={() => {
						void page.navigate({ to: "/settings" });
					}}
				>
					<Settings className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

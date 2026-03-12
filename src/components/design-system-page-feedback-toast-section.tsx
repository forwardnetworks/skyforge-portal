import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

export function DesignSystemPageFeedbackToastSection() {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-semibold">Feedback & Status</h2>
			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-muted-foreground">
						Empty State
					</h3>
					<div className="border rounded-lg p-4">
						<EmptyState
							icon={Inbox}
							title="No items found"
							description="You haven't created any items yet."
							action={{
								label: "Create Item",
								onClick: () => toast("Clicked create"),
							}}
							className="min-h-[200px]"
						/>
					</div>
				</div>
				<div className="space-y-4">
					<h3 className="text-sm font-medium text-muted-foreground">
						Skeleton Loading
					</h3>
					<Card>
						<CardHeader>
							<Skeleton className="h-5 w-[140px] mb-2" />
							<Skeleton className="h-4 w-[250px]" />
						</CardHeader>
						<CardContent className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</CardContent>
					</Card>
				</div>
			</div>

			<h2 className="text-xl font-semibold">Toast Notifications</h2>
			<div className="flex flex-wrap gap-4">
				<Button variant="outline" onClick={() => toast("Event has been created")}>
					Simple Toast
				</Button>
				<Button
					variant="outline"
					onClick={() => toast.success("Event created successfully")}
				>
					Success
				</Button>
				<Button variant="outline" onClick={() => toast.error("Failed to create event")}>
					Error
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast.info("New updates available", {
							description: "Refresh to see changes",
						})
					}
				>
					With Description
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast("Event deleted", {
							action: { label: "Undo", onClick: () => console.log("Undo") },
						})
					}
				>
					With Action
				</Button>
			</div>
		</section>
	);
}

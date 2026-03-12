import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
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
import { PlatformReservationsPreflightCard } from "./platform-reservations-preflight-card";

export function PlatformReservationsRequestCard(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Request Capacity</CardTitle>
				<CardDescription>
					Reservation admission is enforced against your platform quota and
					overlap limits.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<div className="space-y-2">
						<Label>Resource class</Label>
						<Select value={page.resourceClass} onValueChange={page.setResourceClass}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="small">small</SelectItem>
								<SelectItem value="standard">standard</SelectItem>
								<SelectItem value="heavy">heavy</SelectItem>
								<SelectItem value="demo-foundry">demo-foundry</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Reservation type</Label>
						<Select value={page.type} onValueChange={page.setType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="scheduled-future">scheduled-future</SelectItem>
								<SelectItem value="persistent-sandbox">
									persistent-sandbox
								</SelectItem>
								<SelectItem value="immediate-interactive">
									immediate-interactive
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Priority tier</Label>
						<Select value={page.priorityTier} onValueChange={page.setPriorityTier}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="standard">standard</SelectItem>
								<SelectItem value="training">training</SelectItem>
								<SelectItem value="curated-demo">curated-demo</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Start</Label>
						<Input
							type="datetime-local"
							value={page.startAt}
							onChange={(e) => page.setStartAt(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>End</Label>
						<Input
							type="datetime-local"
							value={page.endAt}
							onChange={(e) => page.setEndAt(e.target.value)}
						/>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Template reference</Label>
						<Input
							value={page.templateRef}
							onChange={(e) => page.setTemplateRef(e.target.value)}
							placeholder="quick-deploy:demo-foundry"
						/>
					</div>
					<div className="space-y-2">
						<Label>Notes</Label>
						<Textarea
							value={page.notes}
							onChange={(e) => page.setNotes(e.target.value)}
							placeholder="Customer meeting, training lab, or persistent sandbox context"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm">
							<Checkbox id="admin-override" checked={false} disabled />
							<Label htmlFor="admin-override" className="text-sm">
								Admin override is granted by support only
							</Label>
						</div>
					</div>
				</div>

				<PlatformReservationsPreflightCard page={page} />

				<Button
					onClick={() => page.createReservationMutation.mutate()}
					disabled={
						page.createReservationMutation.isPending ||
						!page.preflightEnabled ||
						page.preflightQ.isLoading ||
						page.preflightQ.isError ||
						(page.preflightQ.data?.allowed ?? true) === false
					}
				>
					{page.createReservationMutation.isPending
						? "Requesting…"
						: "Request reservation"}
				</Button>
			</CardContent>
		</Card>
	);
}

import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

type ReservedBlockFormProps = {
	reservedBlockResourceClass: string;
	setReservedBlockResourceClass: (value: string) => void;
	reservedBlockStartAt: string;
	setReservedBlockStartAt: (value: string) => void;
	reservedBlockEndAt: string;
	setReservedBlockEndAt: (value: string) => void;
	reservedBlockNotes: string;
	setReservedBlockNotes: (value: string) => void;
	createReservedBlockMutation: PlatformCapacityPageState["createReservedBlockMutation"];
};

type ReservationsAdminTableProps = {
	reservations: PlatformCapacityPageState["reservations"];
	updateReservationStatusMutation: PlatformCapacityPageState["updateReservationStatusMutation"];
};

export function PlatformCapacityReservedBlockCard({
	reservedBlockResourceClass,
	setReservedBlockResourceClass,
	reservedBlockStartAt,
	setReservedBlockStartAt,
	reservedBlockEndAt,
	setReservedBlockEndAt,
	reservedBlockNotes,
	setReservedBlockNotes,
	createReservedBlockMutation,
}: ReservedBlockFormProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Protect Curated Demo Capacity</CardTitle>
				<CardDescription>
					Create an approved reserved block that standard reservations cannot consume. Curated quick deploy and admin override flows can still use these windows.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<div className="space-y-2">
						<Label>Resource class</Label>
						<Select value={reservedBlockResourceClass} onValueChange={setReservedBlockResourceClass}>
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
						<Label>Start</Label>
						<Input
							type="datetime-local"
							value={reservedBlockStartAt}
							onChange={(e) => setReservedBlockStartAt(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>End</Label>
						<Input
							type="datetime-local"
							value={reservedBlockEndAt}
							onChange={(e) => setReservedBlockEndAt(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Notes</Label>
						<Textarea
							value={reservedBlockNotes}
							onChange={(e) => setReservedBlockNotes(e.target.value)}
							placeholder="Executive demo window, training wave, or other protected demand"
						/>
					</div>
				</div>
				<Button
					onClick={() => createReservedBlockMutation.mutate()}
					disabled={createReservedBlockMutation.isPending}
				>
					{createReservedBlockMutation.isPending ? "Creating…" : "Create reserved block"}
				</Button>
			</CardContent>
		</Card>
	);
}

export function PlatformCapacityReservationsAdminTable({
	reservations,
	updateReservationStatusMutation,
}: ReservationsAdminTableProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Reservations</CardTitle>
				<CardDescription>
					Current platform reservation requests. Admission control is now enforced server-side against quota and overlap.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead className="border-b text-left text-muted-foreground">
							<tr>
								<th className="py-2 pr-4">User</th>
								<th className="py-2 pr-4">Class</th>
								<th className="py-2 pr-4">Type</th>
								<th className="py-2 pr-4">Status</th>
								<th className="py-2 pr-4">Priority</th>
								<th className="py-2 pr-4">Scope</th>
								<th className="py-2 pr-4">Window</th>
								<th className="py-2 pr-4">Template</th>
								<th className="py-2 pr-4">Actions</th>
							</tr>
						</thead>
						<tbody>
							{reservations.map((item) => (
								<tr key={item.id} className="border-b align-top">
									<td className="py-2 pr-4 font-medium">{item.username}</td>
									<td className="py-2 pr-4">{item.resourceClass}</td>
									<td className="py-2 pr-4">{item.type}</td>
									<td className="py-2 pr-4">{item.status}</td>
									<td className="py-2 pr-4 text-xs">
										<Badge variant="outline">{item.priorityTier ?? "standard"}</Badge>
									</td>
									<td className="py-2 pr-4 text-xs">
										<div className="flex flex-wrap gap-1">
											{item.adminOverride ? <Badge variant="secondary">admin override</Badge> : null}
											{item.isCuratedDemo ? <Badge variant="outline">curated</Badge> : null}
											{!item.adminOverride && !item.isCuratedDemo ? (
												<span className="text-muted-foreground">-</span>
											) : null}
										</div>
									</td>
									<td className="py-2 pr-4 text-xs text-muted-foreground">
										<div>{item.startAt}</div>
										<div>{item.endAt}</div>
									</td>
									<td className="py-2 pr-4 text-xs text-muted-foreground">{item.templateRef || "-"}</td>
									<td className="py-2 pr-4">
										<div className="flex flex-wrap gap-2">
						{item.status === "requested" ? (
							<>
								<Button
									size="sm"
									onClick={() =>
										updateReservationStatusMutation.mutate({ id: item.id, status: "approved" })
									}
									disabled={updateReservationStatusMutation.isPending}
								>
									Approve
								</Button>
								<Button
									size="sm"
									variant="secondary"
									onClick={() =>
										updateReservationStatusMutation.mutate({ id: item.id, status: "rejected" })
									}
									disabled={updateReservationStatusMutation.isPending}
								>
									Reject
								</Button>
							</>
						) : null}
						{item.status === "requested" || item.status === "approved" ? (
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									updateReservationStatusMutation.mutate({ id: item.id, status: "cancelled" })
								}
								disabled={updateReservationStatusMutation.isPending}
							>
								Cancel
							</Button>
						) : (
							<span className="text-xs text-muted-foreground">No actions</span>
						)}
										</div>
									</td>
								</tr>
							))}
							{reservations.length === 0 ? (
								<tr>
									<td className="py-6 text-center text-muted-foreground" colSpan={9}>
										No reservations recorded.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

import { useForwardTestDrivesPage } from "@/hooks/use-forward-testdrives-page";
import { toast } from "sonner";
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

export function ForwardTestDrivesCard() {
	const page = useForwardTestDrivesPage();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Customer TestDrives</CardTitle>
				<CardDescription>
					Provision customer-specific Forward demo orgs with isolated
					credentials, resettable seeded topology, and per-owner limits.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 md:grid-cols-3">
					<div className="space-y-2 md:col-span-2">
						<Label htmlFor="forward-testdrive-customer">Customer name</Label>
						<Input
							id="forward-testdrive-customer"
							value={page.customerName}
							onChange={(event) => page.setCustomerName(event.target.value)}
							placeholder="Acme Corp"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="forward-testdrive-id">
							TestDrive ID (optional)
						</Label>
						<Input
							id="forward-testdrive-id"
							value={page.testDriveID}
							onChange={(event) => page.setTestDriveID(event.target.value)}
							placeholder="acme-lab"
						/>
					</div>
				</div>

				<Button
					onClick={() => page.createMutation.mutate()}
					disabled={
						page.createMutation.isPending || !page.customerName.trim().length
					}
				>
					{page.createMutation.isPending
						? "Provisioning..."
						: "Create TestDrive"}
				</Button>

				{page.testDrivesQ.isLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading TestDrives...
					</div>
				) : null}
				{page.testDrivesQ.isError ? (
					<div className="space-y-1 text-sm text-destructive">
						<div>Failed to load TestDrives.</div>
						{page.testDrivesQ.error instanceof Error ? (
							<div className="break-all text-xs">
								{page.testDrivesQ.error.message}
							</div>
						) : null}
					</div>
				) : null}
				{!page.testDrivesQ.isLoading && page.items.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No TestDrives configured.
					</div>
				) : null}

				<div className="space-y-3">
					{page.items.map((item) => {
						const testDriveID = item.record.testDriveId;
						const username = item.credential?.username ?? "";
						const revealedPassword = page.revealedPasswords[testDriveID] ?? "";
						const testDriveLaunchHref = `/api/forward/session?tenant=testdrive&scope=${encodeURIComponent(testDriveID)}`;
						const provisioningStatus = String(
							item.record.provisioningStatus ?? "ready",
						).toLowerCase();
						const provisioningStep = String(
							item.record.provisioningStep ?? "",
						).trim();
						const provisioningError = String(
							item.record.provisioningError ?? "",
						).trim();
						const isProvisioning =
							provisioningStatus === "queued" ||
							provisioningStatus === "running";
						const launchDisabled = provisioningStatus !== "ready";
						return (
							<div
								key={testDriveID}
								className="space-y-3 rounded-md border p-3 md:p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-2">
									<div className="space-y-1">
										<div className="font-medium">
											{item.record.customerName}
										</div>
										<div className="text-xs text-muted-foreground">
											ID: <span className="font-mono">{testDriveID}</span>
										</div>
										<div className="text-xs text-muted-foreground">
											Status: {item.record.status || "active"} / Provisioning:{" "}
											{provisioningStatus || "ready"}
										</div>
										{provisioningStep ? (
											<div className="text-xs text-muted-foreground">
												Step: {provisioningStep}
											</div>
										) : null}
										{provisioningError ? (
											<div className="text-xs text-destructive">
												Error: {provisioningError}
											</div>
										) : null}
									</div>
									<div className="text-xs text-muted-foreground">
										Updated:{" "}
										{item.record.updatedAt || item.record.createdAt || "—"}
									</div>
								</div>

								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<div className="text-xs text-muted-foreground">
											Forward username
										</div>
										<div className="break-all font-mono text-sm">
											{username || "—"}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs text-muted-foreground">
											Forward password
										</div>
										<div className="break-all font-mono text-sm">
											{revealedPassword || "••••••••••••••••"}
										</div>
									</div>
								</div>

								<div className="flex flex-wrap gap-2">
									<Button size="sm" asChild disabled={launchDisabled}>
										<a
											href={testDriveLaunchHref}
											target="_blank"
											rel="noreferrer"
										>
											Open TestDrive Org
										</a>
									</Button>
									{isProvisioning ? (
										<div className="self-center text-xs text-muted-foreground">
											Provisioning in progress...
										</div>
									) : null}
									<Button
										size="sm"
										variant="outline"
										onClick={() => page.revealMutation.mutate(testDriveID)}
										disabled={page.revealMutation.isPending}
									>
										{page.revealMutation.isPending
											? "Revealing..."
											: "Reveal password"}
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											if (!username.trim()) return;
											void navigator.clipboard?.writeText(username);
											toast.success("Forward username copied");
										}}
										disabled={!username.trim().length}
									>
										Copy username
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											const value = revealedPassword.trim();
											if (!value) return;
											void navigator.clipboard?.writeText(value);
											toast.success("Forward password copied");
										}}
										disabled={!revealedPassword.trim().length}
									>
										Copy password
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											page.resetCredentialMutation.mutate(testDriveID)
										}
										disabled={page.resetCredentialMutation.isPending}
									>
										{page.resetCredentialMutation.isPending
											? "Resetting..."
											: "Reset credential"}
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											page.resetTopologyMutation.mutate(testDriveID)
										}
										disabled={page.resetTopologyMutation.isPending}
									>
										{page.resetTopologyMutation.isPending
											? "Resetting..."
											: "Reset topology"}
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => page.deleteMutation.mutate(testDriveID)}
										disabled={page.deleteMutation.isPending}
									>
										{page.deleteMutation.isPending ? "Deleting..." : "Delete"}
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

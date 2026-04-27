import { ForwardTestDrivesCard } from "./forward-testdrives-card";

export function ForwardTestDrivesPageContent() {
	return (
		<div className="w-full space-y-6 p-4 sm:p-6 xl:p-8">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					Forward TestDrive Provisioning
				</h1>
				<p className="text-sm text-muted-foreground">
					Provision and manage customer TestDrive orgs with isolated
					credentials, reseed controls, and direct launch links.
				</p>
			</div>
			<ForwardTestDrivesCard />
		</div>
	);
}

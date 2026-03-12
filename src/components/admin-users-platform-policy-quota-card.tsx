import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	FieldHelp,
	resourceClassDescriptions,
	resourceClasses,
} from "./admin-users-platform-policy-shared";

type QuotaDraft = {
	maxConcurrentLabs: string;
	maxPersistentLabs: string;
	maxPersistentHours: string;
	maxResourceClass: string;
};

type Props = {
	platformQuotaDraft: QuotaDraft;
	platformQuotaValidationErrors: {
		maxConcurrentLabs?: string;
		maxPersistentLabs?: string;
		maxPersistentHours?: string;
	};
	platformQuotaHasErrors: boolean;
	savePlatformQuotaPending: boolean;
	platformPolicyTargetUser: string;
	onPlatformQuotaDraftChange: (
		field:
			| "maxConcurrentLabs"
			| "maxPersistentLabs"
			| "maxPersistentHours"
			| "maxResourceClass",
		value: string,
	) => void;
	onSavePlatformQuota: () => void;
};

export function AdminUsersPlatformPolicyQuotaCard(props: Props) {
	return (
		<div className="space-y-4 rounded-lg border border-border/60 p-4">
			<div className="text-sm font-medium">Quota override</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="quota-max-concurrent">Max concurrent labs</Label>
					<Input
						id="quota-max-concurrent"
						value={props.platformQuotaDraft.maxConcurrentLabs}
						onChange={(event) =>
							props.onPlatformQuotaDraftChange(
								"maxConcurrentLabs",
								event.target.value,
							)
						}
					/>
					<FieldHelp
						error={props.platformQuotaValidationErrors.maxConcurrentLabs}
						help="Maximum overlapping reservations or active launches."
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="quota-max-persistent">Max persistent labs</Label>
					<Input
						id="quota-max-persistent"
						value={props.platformQuotaDraft.maxPersistentLabs}
						onChange={(event) =>
							props.onPlatformQuotaDraftChange(
								"maxPersistentLabs",
								event.target.value,
							)
						}
					/>
					<FieldHelp
						error={props.platformQuotaValidationErrors.maxPersistentLabs}
						help="How many long-lived sandboxes the user may retain."
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="quota-max-hours">Max persistent hours</Label>
					<Input
						id="quota-max-hours"
						value={props.platformQuotaDraft.maxPersistentHours}
						onChange={(event) =>
							props.onPlatformQuotaDraftChange(
								"maxPersistentHours",
								event.target.value,
							)
						}
					/>
					<FieldHelp
						error={props.platformQuotaValidationErrors.maxPersistentHours}
						help="Maximum lifetime for persisted labs before expiry."
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="quota-resource-class">Max resource class</Label>
					<Select
						value={props.platformQuotaDraft.maxResourceClass}
						onValueChange={(value) =>
							props.onPlatformQuotaDraftChange(
								"maxResourceClass",
								value,
							)
						}
					>
						<SelectTrigger id="quota-resource-class">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{resourceClasses.map((value) => (
								<SelectItem key={value} value={value}>
									{value}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="text-xs text-muted-foreground">
						{
							resourceClassDescriptions[
								props.platformQuotaDraft.maxResourceClass as keyof typeof resourceClassDescriptions
							] ??
							resourceClassDescriptions.standard
						}
					</div>
				</div>
			</div>
			{props.platformQuotaHasErrors ? (
				<div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
					Fix quota validation errors before saving.
				</div>
			) : null}
			<Button
				onClick={props.onSavePlatformQuota}
				disabled={
					props.savePlatformQuotaPending ||
					!props.platformPolicyTargetUser ||
					props.platformQuotaHasErrors
				}
			>
				Save quota
			</Button>
		</div>
	);
}

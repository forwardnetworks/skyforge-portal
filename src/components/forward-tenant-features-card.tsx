import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;
type FeatureTenant = "primary" | "customer";

type FeatureToggleField = {
	key:
		| "predictModeling"
		| "nqeEspresso"
		| "nqeSecurityRulesPanos"
		| "topoLayoutVersioning"
		| "networkMaps"
		| "devParser"
		| "aiAllowed"
		| "predictAiAssist"
		| "aiChats";
	label: string;
	description: string;
};

const FEATURE_FIELDS: FeatureToggleField[] = [
	{
		key: "predictModeling",
		label: "Predict modeling",
		description: "Enable predictive modeling experiences.",
	},
	{
		key: "nqeEspresso",
		label: "NQE Espresso",
		description: "Enable NQE Espresso execution paths.",
	},
	{
		key: "nqeSecurityRulesPanos",
		label: "NQE security rules PAN-OS",
		description: "Enable PAN-OS security rules support in NQE.",
	},
	{
		key: "topoLayoutVersioning",
		label: "Topology layout versioning",
		description: "Enable topology layout versioning workflows.",
	},
	{
		key: "networkMaps",
		label: "Network maps",
		description: "Enable network maps experiences.",
	},
	{
		key: "devParser",
		label: "Dev parser",
		description:
			"Use the development parser set for the selected Forward org.",
	},
	{
		key: "aiAllowed",
		label: "AI enabled",
		description: "Enable NQE Assist AI and related AI-backed workflows.",
	},
	{
		key: "predictAiAssist",
		label: "Predict AI assist",
		description: "Enable Predict AI assistant flows.",
	},
	{
		key: "aiChats",
		label: "AI chats",
		description:
			"Enable AI chat experiences where supported by profile and model config.",
	},
];

const DEFAULT_FEATURE_FLAGS = {
	predictModeling: true,
	nqeEspresso: true,
	nqeSecurityRulesPanos: true,
	topoLayoutVersioning: true,
	networkMaps: true,
	devParser: false,
	aiAllowed: true,
	predictAiAssist: true,
	aiChats: true,
};

export function ForwardTenantFeaturesCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;
	const [tenant, setTenant] = useState<FeatureTenant>("primary");
	const tenantFeaturesQ = page.tenantFeaturesQueries[tenant];
	const [draft, setDraft] = useState(DEFAULT_FEATURE_FLAGS);

	useEffect(() => {
		if (tenantFeaturesQ.data?.features) {
			setDraft(tenantFeaturesQ.data.features);
			return;
		}
		setDraft(DEFAULT_FEATURE_FLAGS);
	}, [tenantFeaturesQ.data?.features, tenant]);

	const dirty =
		JSON.stringify(draft) !==
		JSON.stringify(tenantFeaturesQ.data?.features ?? DEFAULT_FEATURE_FLAGS);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Experimental Features</CardTitle>
				<CardDescription>
					Control experimental features for the selected Forward org.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
					<div className="space-y-2">
						<Label>Feature target org</Label>
						<Select
							value={tenant}
							onValueChange={(value) => setTenant(value as FeatureTenant)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Forward org" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="primary">Deployment Org</SelectItem>
								<SelectItem value="customer">Customer Org</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				{tenantFeaturesQ.isLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading feature flags…
					</div>
				) : null}
				{tenantFeaturesQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load Forward org feature flags.
					</div>
				) : null}
				<div className="space-y-3">
					{FEATURE_FIELDS.map((feature) => (
						<div key={feature.key} className="rounded border p-3">
							<div className="flex items-start gap-3">
								<Checkbox
									checked={Boolean(draft[feature.key])}
									onCheckedChange={(checked) =>
										setDraft((prev) => ({
											...prev,
											[feature.key]: Boolean(checked),
										}))
									}
								/>
								<div className="space-y-1">
									<Label className="text-sm font-medium">{feature.label}</Label>
									<div className="text-xs text-muted-foreground">
										{feature.description}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
				<div>
					<Button
						variant="outline"
						disabled={!dirty || page.saveTenantFeaturesMutation.isPending}
						onClick={() =>
							page.saveTenantFeaturesMutation.mutate({
								tenant,
								features: draft,
							})
						}
					>
						{page.saveTenantFeaturesMutation.isPending
							? "Saving…"
							: "Save feature preferences"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

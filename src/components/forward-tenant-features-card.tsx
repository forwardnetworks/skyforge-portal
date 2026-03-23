import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

type FeatureToggleField = {
	key:
		| "predictModeling"
		| "nqeEspresso"
		| "nqeSecurityRulesPanos"
		| "topoLayoutVersioning"
		| "networkMaps";
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
];

export function ForwardTenantFeaturesCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;
	const [draft, setDraft] = useState(
		page.tenantFeaturesQ.data?.features ?? {
			predictModeling: true,
			nqeEspresso: true,
			nqeSecurityRulesPanos: true,
			topoLayoutVersioning: true,
			networkMaps: true,
		},
	);

	useEffect(() => {
		if (!page.tenantFeaturesQ.data?.features) return;
		setDraft(page.tenantFeaturesQ.data.features);
	}, [page.tenantFeaturesQ.data?.features]);

	const dirty = JSON.stringify(draft) !== JSON.stringify(page.tenantFeaturesQ.data?.features);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Experimental Features</CardTitle>
				<CardDescription>
					Control experimental Forward org features per user. Saving applies
					these to the current managed org and to future rebuilds.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{page.tenantFeaturesQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading feature flags…</div>
				) : null}
				{page.tenantFeaturesQ.isError ? (
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

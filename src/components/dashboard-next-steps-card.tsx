import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function DashboardNextStepsCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Next steps</CardTitle>
				<CardDescription>
					Use quotas and availability together before reserving or launching heavy
					labs.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2 text-sm text-muted-foreground">
				<p>Use Launch Lab for curated demos and repeatable training flows.</p>
				<p>
					Reserve capacity when you need a future slot or a persistent sandbox.
				</p>
				<p>
					Check Settings if your current profile or quota does not match the
					workflow you need.
				</p>
			</CardContent>
		</Card>
	);
}

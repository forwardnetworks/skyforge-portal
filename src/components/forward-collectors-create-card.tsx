import type { ForwardCollectorsPageState } from "@/hooks/use-forward-collectors-page";
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

export function ForwardCollectorsCreateCard(props: {
	page: ForwardCollectorsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create collector</CardTitle>
				<CardDescription>
					Creates a Forward collector and deploys a matching in-cluster
					Deployment. Deleting here only deletes the in-cluster Deployment and
					the saved credentials; it does not delete the Forward-side collector.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Collector name</Label>
					<Input
						value={page.collectorName}
						onChange={(e) => {
							page.setCollectorNameTouched(true);
							page.setCollectorName(e.target.value);
						}}
						placeholder="skyforge-yourname"
					/>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Forward target</Label>
						<Select
							value={page.target}
							onValueChange={(value) => page.setTarget(value as any)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cloud">in-cluster</SelectItem>
								<SelectItem value="onprem">on-prem</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{page.target === "onprem" ? (
						<div className="space-y-2">
							<Label>On-prem host</Label>
							<Input
								value={page.onPremHost}
								onChange={(e) => page.setOnPremHost(e.target.value)}
								placeholder="forward.example.com (:port)"
							/>
						</div>
					) : null}
				</div>

				{page.target === "onprem" ? (
					<div className="flex items-center gap-2">
						<Checkbox
							checked={page.skipTlsVerify}
							onCheckedChange={(value) => page.setSkipTlsVerify(Boolean(value))}
						/>
						<Label className="text-sm">Skip TLS verification</Label>
					</div>
				) : null}

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Forward username</Label>
						<Input
							value={page.username}
							onChange={(e) => page.setUsername(e.target.value)}
							placeholder="you@company.com"
						/>
					</div>
					<div className="space-y-2">
						<Label>Forward password</Label>
						<Input
							type="password"
							value={page.password}
							onChange={(e) => page.setPassword(e.target.value)}
							placeholder="••••••••"
						/>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Checkbox
						checked={page.setDefault}
						onCheckedChange={(value) => page.setSetDefault(Boolean(value))}
					/>
					<Label className="text-sm">Make default</Label>
				</div>

				<Button
					onClick={() => page.createMutation.mutate()}
					disabled={page.createMutation.isPending}
				>
					{page.createMutation.isPending ? "Creating…" : "Create"}
				</Button>
			</CardContent>
		</Card>
	);
}

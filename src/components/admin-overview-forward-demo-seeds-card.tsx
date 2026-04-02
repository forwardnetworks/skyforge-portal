import { useEffect, useMemo, useState } from "react";
import type { AdminForwardSectionProps } from "./settings-section-types";
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

export function AdminOverviewForwardDemoSeedsCard(
	props: AdminForwardSectionProps,
) {
	const [networkName, setNetworkName] = useState("");
	const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
	const [repeatDrafts, setRepeatDrafts] = useState<Record<string, string>>({});

	useEffect(() => {
		setNetworkName(props.forwardDemoSeedCatalog?.networkName ?? "");
	}, [props.forwardDemoSeedCatalog?.networkName]);

	useEffect(() => {
		const next: Record<string, string> = {};
		const repeats: Record<string, string> = {};
		for (const seed of props.forwardDemoSeedCatalog?.seeds ?? []) {
			next[seed.id] = seed.note;
			repeats[seed.id] = String(seed.repeatCount || 1);
		}
		setNoteDrafts(next);
		setRepeatDrafts(repeats);
	}, [props.forwardDemoSeedCatalog?.seeds]);

	const seeds = useMemo(
		() =>
			[...(props.forwardDemoSeedCatalog?.seeds ?? [])].sort(
				(a, b) => a.order - b.order,
			),
		[props.forwardDemoSeedCatalog?.seeds],
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Forward Demo Seed Catalog</CardTitle>
				<CardDescription>
					Ordered snapshot archives replayed into each user's demo org during
					manual and nightly rebuilds. Seed binaries now come from the blueprints
					repo; Skyforge only edits manifest metadata.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
					<div>Source: {props.forwardDemoSeedCatalog?.source ?? "gitea"}</div>
					<div>
						Repo: {props.forwardDemoSeedCatalog?.repo ?? "skyforge/blueprints"} @{" "}
						{props.forwardDemoSeedCatalog?.branch ?? "main"}
					</div>
					<div>
						Manifest: {props.forwardDemoSeedCatalog?.manifestPath ?? "forward/demo-seeds/catalog.yaml"}
					</div>
					<div>
						Last commit: {props.forwardDemoSeedCatalog?.lastCommitSha ?? "—"}
					</div>
				</div>
				{props.forwardDemoSeedCatalog?.manifestValid ? null : (
					<div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
						{props.forwardDemoSeedCatalog?.manifestError ||
							"The demo seed manifest is missing or invalid."}
					</div>
				)}
				<div className="rounded border p-3 text-sm text-muted-foreground">
					Add or replace snapshot archives in the blueprints repo. Use Skyforge here
					to reorder entries, rename notes, enable or disable entries, and remove
					manifest rows.
				</div>
				<div className="grid gap-4 md:grid-cols-[1.2fr_auto]">
					<div className="space-y-2">
						<Label>Network name</Label>
						<Input
							value={networkName}
							onChange={(e) => setNetworkName(e.target.value)}
							placeholder="Demo Network"
						/>
					</div>
					<div className="flex items-end">
						<Button
							variant="outline"
							onClick={() =>
								props.onSaveForwardDemoSeedConfig({
									networkName: networkName.trim() || "Demo Network",
								})
							}
							disabled={props.saveForwardDemoSeedConfigPending}
						>
							{props.saveForwardDemoSeedConfigPending ? "Saving…" : "Save network"}
						</Button>
					</div>
				</div>
				<div className="rounded border p-3">
					<div className="mb-3 text-sm font-medium">Replay order</div>
					{seeds.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No demo seed entries are present in the manifest.
						</div>
					) : (
						<div className="space-y-3">
							{seeds.map((seed, index) => (
								<div
									key={seed.id}
									className="rounded border p-3"
								>
									<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
										<div className="space-y-2">
											<Input
												value={noteDrafts[seed.id] ?? seed.note}
												onChange={(e) =>
													setNoteDrafts((current) => ({
														...current,
														[seed.id]: e.target.value,
													}))
												}
												placeholder="Snapshot note"
											/>
											<div className="text-xs text-muted-foreground">
												{seed.assetPath} · {seed.enabled ? "enabled" : "disabled"} · repeat {seed.repeatCount}
											</div>
											<div className="space-y-2">
												<Label htmlFor={`seed-repeat-${seed.id}`}>Repeat count</Label>
												<Input
													id={`seed-repeat-${seed.id}`}
													type="number"
													min={1}
													step={1}
													value={repeatDrafts[seed.id] ?? String(seed.repeatCount || 1)}
													onChange={(e) =>
														setRepeatDrafts((current) => ({
															...current,
															[seed.id]: e.target.value,
														}))
													}
													placeholder="1"
												/>
											</div>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												size="sm"
												disabled={props.updateForwardDemoSeedPending}
												onClick={() =>
													props.onUpdateForwardDemoSeed({
														seedID: seed.id,
														note: (noteDrafts[seed.id] ?? seed.note).trim(),
														repeatCount: Math.max(
															1,
															Number.parseInt(
																repeatDrafts[seed.id] ?? String(seed.repeatCount || 1),
																10,
															) || 1,
														),
													})
												}
											>
												Save metadata
											</Button>
											<Button
												variant="outline"
												size="sm"
												disabled={props.updateForwardDemoSeedPending || index === 0}
												onClick={() =>
													props.onUpdateForwardDemoSeed({
														seedID: seed.id,
														order: index - 1,
													})
												}
											>
												Move up
											</Button>
											<Button
												variant="outline"
												size="sm"
												disabled={props.updateForwardDemoSeedPending || index === seeds.length - 1}
												onClick={() =>
													props.onUpdateForwardDemoSeed({
														seedID: seed.id,
														order: index + 1,
													})
												}
											>
												Move down
											</Button>
											<Button
												variant="outline"
												size="sm"
												disabled={props.updateForwardDemoSeedPending}
												onClick={() =>
													props.onUpdateForwardDemoSeed({
														seedID: seed.id,
														enabled: !seed.enabled,
													})
												}
											>
												{seed.enabled ? "Disable" : "Enable"}
											</Button>
											<Button
												variant="destructive"
												size="sm"
												disabled={props.deleteForwardDemoSeedPending}
												onClick={() => props.onDeleteForwardDemoSeed(seed.id)}
											>
												Delete
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

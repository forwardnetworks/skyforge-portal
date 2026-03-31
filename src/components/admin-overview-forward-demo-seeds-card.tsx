import { useEffect, useMemo, useState } from "react";
import type { AdminOverviewTabProps } from "./admin-settings-tab-types";
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

async function fileToBase64(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	let binary = "";
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i] ?? 0);
	}
	return btoa(binary);
}

function formatBytes(value?: number) {
	const bytes = Number(value ?? 0);
	if (!Number.isFinite(bytes) || bytes <= 0) return "—";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function AdminOverviewForwardDemoSeedsCard(
	props: AdminOverviewTabProps,
) {
	const [note, setNote] = useState("");
	const [networkName, setNetworkName] = useState("");
	const [enabled, setEnabled] = useState(true);
	const [file, setFile] = useState<File | null>(null);

	useEffect(() => {
		setNetworkName(props.forwardDemoSeedCatalog?.networkName ?? "");
	}, [props.forwardDemoSeedCatalog?.networkName]);

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
					Ordered snapshot archives replayed into each user&apos;s demo org
					during manual and nightly rebuilds.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-xs text-muted-foreground">
					Current status:{" "}
					{props.forwardDemoSeedCatalogLoading
						? "loading"
						: props.forwardDemoSeedCatalog?.configured
							? "configured"
							: "not configured"}
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
							{props.saveForwardDemoSeedConfigPending
								? "Saving…"
								: "Save network"}
						</Button>
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
					<div className="space-y-2">
						<Label>Note</Label>
						<Input
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Core demo baseline"
						/>
					</div>
					<div className="space-y-2">
						<Label>Snapshot zip</Label>
						<Input
							type="file"
							accept=".zip,application/zip,application/octet-stream"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						/>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						checked={enabled}
						onCheckedChange={(value) => setEnabled(Boolean(value))}
					/>
					<Label>Enable this seed after upload</Label>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						onClick={async () => {
							if (!file) return;
							const contentBase64 = await fileToBase64(file);
							props.onUploadForwardDemoSeed({
								note: note.trim() || file.name.replace(/\.zip$/i, ""),
								networkName: networkName.trim() || "Demo Network",
								fileName: file.name,
								contentBase64,
								enabled,
							});
							setNote("");
							setFile(null);
						}}
						disabled={!file || props.uploadForwardDemoSeedPending}
					>
						{props.uploadForwardDemoSeedPending ? "Uploading…" : "Upload seed"}
					</Button>
				</div>
				<div className="rounded border p-3">
					<div className="mb-3 text-sm font-medium">Replay order</div>
					{seeds.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No demo seed archives uploaded yet.
						</div>
					) : (
						<div className="space-y-3">
							{seeds.map((seed, index) => (
								<div
									key={seed.id}
									className="flex flex-col gap-3 rounded border p-3 md:flex-row md:items-center md:justify-between"
								>
									<div className="space-y-1">
										<div className="font-medium">{seed.note}</div>
										<div className="text-xs text-muted-foreground">
											{seed.fileName} · {formatBytes(seed.sizeBytes)} ·{" "}
											{seed.enabled ? "enabled" : "disabled"}
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											variant="outline"
											size="sm"
											disabled={
												props.updateForwardDemoSeedPending || index === 0
											}
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
											disabled={
												props.updateForwardDemoSeedPending ||
												index === seeds.length - 1
											}
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
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

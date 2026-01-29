import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-keys";
import { listRegistryRepositories, listRegistryTags } from "@/lib/skyforge-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function RegistryImagePicker(props: {
	value: string;
	onChange: (image: string) => void;
	className?: string;
}) {
	const [repoQuery, setRepoQuery] = useState("");
	const [tagQuery, setTagQuery] = useState("");
	const [repo, setRepo] = useState("");

	const reposQ = useQuery({
		queryKey: queryKeys.registryRepos(repoQuery),
		queryFn: async () => listRegistryRepositories({ q: repoQuery, n: 500 }),
		retry: false,
		staleTime: 30_000,
	});

	const tagsQ = useQuery({
		queryKey: repo
			? queryKeys.registryTags(repo, tagQuery)
			: ["registryTags", "none"],
		queryFn: async () => listRegistryTags(repo, { q: tagQuery }),
		enabled: Boolean(repo),
		retry: false,
		staleTime: 30_000,
	});

	const selected = useMemo(() => {
		const v = (props.value || "").trim();
		const idx = v.lastIndexOf(":");
		if (idx <= 0) return { repo: v, tag: "" };
		return { repo: v.slice(0, idx), tag: v.slice(idx + 1) };
	}, [props.value]);

	return (
		<div className={`space-y-3 ${props.className ?? ""}`}>
			<div className="space-y-1">
				<Label>Image</Label>
				<Input
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					placeholder="repo:tag"
				/>
				<div className="text-xs text-muted-foreground">
					Registry-backed picker. Requires server env `SKYFORGE_REGISTRY_URL`.
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<Label>Repository</Label>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								if (!selected.repo) return;
								setRepo(selected.repo);
								toast.message("Repository selected", {
									description: selected.repo,
								});
							}}
						>
							Use current
						</Button>
					</div>
					<Input
						value={repoQuery}
						onChange={(e) => setRepoQuery(e.target.value)}
						placeholder="Search repos…"
					/>
					<div className="max-h-40 overflow-auto rounded-md border">
						{reposQ.isError ? (
							<div className="p-2 text-xs text-destructive">
								Failed to load repos.
							</div>
						) : reposQ.isLoading ? (
							<div className="p-2 text-xs text-muted-foreground">Loading…</div>
						) : (
							<div className="divide-y">
								{(reposQ.data?.repositories ?? []).slice(0, 200).map((r) => (
									<button
										type="button"
										key={r}
										className={`w-full text-left px-2 py-1.5 text-xs font-mono hover:bg-accent ${
											repo === r ? "bg-accent" : ""
										}`}
										onClick={() => setRepo(r)}
									>
										{r}
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<Label>Tag</Label>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => {
								if (!repo) return;
								const image = `${repo}:${selected.tag || "latest"}`;
								props.onChange(image);
							}}
							disabled={!repo}
						>
							Set image
						</Button>
					</div>
					<Input
						value={tagQuery}
						onChange={(e) => setTagQuery(e.target.value)}
						placeholder="Search tags…"
						disabled={!repo}
					/>
					<div className="max-h-40 overflow-auto rounded-md border">
						{!repo ? (
							<div className="p-2 text-xs text-muted-foreground">
								Select a repo…
							</div>
						) : tagsQ.isError ? (
							<div className="p-2 text-xs text-destructive">
								Failed to load tags.
							</div>
						) : tagsQ.isLoading ? (
							<div className="p-2 text-xs text-muted-foreground">Loading…</div>
						) : (
							<div className="divide-y">
								{(tagsQ.data?.tags ?? []).slice(0, 300).map((t) => (
									<button
										type="button"
										key={t}
										className="w-full text-left px-2 py-1.5 text-xs font-mono hover:bg-accent"
										onClick={() => props.onChange(`${repo}:${t}`)}
									>
										{t}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

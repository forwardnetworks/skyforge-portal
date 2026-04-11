import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { inferPaletteItemFromRepo } from "@/components/lab-designer-palette";
import {
	type AdminRegistryCatalogResponse,
	type RegistryReposResponse,
	type RegistryCatalogImageEntry,
	putAdminRegistryCatalog,
	triggerAdminRegistryCatalogPrepull,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthRegistryCatalogArgs = {
	queryClient: QueryClient;
	registryCatalog: AdminRegistryCatalogResponse | undefined;
	registryRepos: RegistryReposResponse | undefined;
	refetchRegistryCatalog: () => Promise<unknown>;
};

const emptyRow: RegistryCatalogImageEntry = {
	label: "",
	nos: "",
	vendor: "",
	model: "",
	kind: "",
	role: "other",
	repository: "",
	defaultTag: "latest",
	enabled: true,
	aliases: [],
};

export function useAdminSettingsAuthRegistryCatalog({
	queryClient,
	registryCatalog,
	registryRepos,
	refetchRegistryCatalog,
}: UseAdminSettingsAuthRegistryCatalogArgs) {
	const [registryBaseURLDraft, setRegistryBaseURLDraft] = useState("");
	const [registrySkipTLSVerifyDraft, setRegistrySkipTLSVerifyDraft] = useState(false);
	const [registryRepoPrefixesDraft, setRegistryRepoPrefixesDraft] = useState("");
	const [registryUsernameDraft, setRegistryUsernameDraft] = useState("");
	const [registryPasswordDraft, setRegistryPasswordDraft] = useState("");
	const [registryPrepullWorkerNodesDraft, setRegistryPrepullWorkerNodesDraft] = useState(false);
	const [registryCatalogImagesDraft, setRegistryCatalogImagesDraft] = useState<RegistryCatalogImageEntry[]>([]);

	useEffect(() => {
		if (!registryCatalog) return;
		setRegistryBaseURLDraft(String(registryCatalog.baseUrl ?? ""));
		setRegistrySkipTLSVerifyDraft(Boolean(registryCatalog.skipTlsVerify));
		setRegistryRepoPrefixesDraft((registryCatalog.repoPrefixes ?? []).join(", "));
		setRegistryUsernameDraft(String(registryCatalog.username ?? ""));
		setRegistryPasswordDraft("");
		setRegistryPrepullWorkerNodesDraft(Boolean(registryCatalog.prepullWorkerNodes));
		setRegistryCatalogImagesDraft(
			Array.isArray(registryCatalog.images) && registryCatalog.images.length > 0
				? registryCatalog.images
				: [],
		);
	}, [
		registryCatalog?.baseUrl,
		registryCatalog?.skipTlsVerify,
		registryCatalog?.repoPrefixes,
		registryCatalog?.username,
		registryCatalog?.prepullWorkerNodes,
		registryCatalog?.images,
	]);

	const upsertRegistryCatalogImage = (
		index: number,
		field: keyof RegistryCatalogImageEntry,
		value: string | boolean | string[],
	) => {
		setRegistryCatalogImagesDraft((prev) =>
			prev.map((row, rowIndex) => {
				if (rowIndex !== index) return row;
				return { ...row, [field]: value };
			}),
		);
	};

	const addRegistryCatalogImage = () => {
		setRegistryCatalogImagesDraft((prev) => [...prev, { ...emptyRow }]);
	};

	const removeRegistryCatalogImage = (index: number) => {
		setRegistryCatalogImagesDraft((prev) =>
			prev.filter((_, rowIndex) => rowIndex !== index),
		);
	};

	const catalogRepoSet = useMemo(() => {
		const set = new Set<string>();
		for (const row of registryCatalogImagesDraft) {
			const repo = String(row.repository ?? "")
				.trim()
				.replace(/^\/+|\/+$/g, "");
			if (repo) set.add(repo);
		}
		return set;
	}, [registryCatalogImagesDraft]);

	const disabledCatalogRepoSet = useMemo(() => {
		const set = new Set<string>();
		for (const row of registryCatalogImagesDraft) {
			if (row.enabled) continue;
			const repo = String(row.repository ?? "")
				.trim()
				.replace(/^\/+|\/+$/g, "");
			if (repo) set.add(repo);
		}
		return set;
	}, [registryCatalogImagesDraft]);

	const discoveredRepos = useMemo(
		() =>
			(registryRepos?.repositories ?? [])
				.map((repo) =>
					String(repo ?? "")
						.trim()
						.replace(/^\/+|\/+$/g, ""),
				)
				.filter(Boolean),
		[registryRepos?.repositories],
	);

	const missingCatalogRepos = useMemo(
		() => discoveredRepos.filter((repo) => !catalogRepoSet.has(repo)),
		[catalogRepoSet, discoveredRepos],
	);

	const disabledDiscoveredRepos = useMemo(
		() => discoveredRepos.filter((repo) => disabledCatalogRepoSet.has(repo)),
		[disabledCatalogRepoSet, discoveredRepos],
	);

	const addMissingRegistryReposToCatalogDraft = () => {
		if (missingCatalogRepos.length === 0) return;
		setRegistryCatalogImagesDraft((prev) => {
			const seen = new Set(
				prev
					.map((row) =>
						String(row.repository ?? "")
							.trim()
							.replace(/^\/+|\/+$/g, ""),
					)
					.filter(Boolean),
			);
			const additions: RegistryCatalogImageEntry[] = [];
			for (const repo of missingCatalogRepos) {
				if (seen.has(repo)) continue;
				const inferred = inferPaletteItemFromRepo(repo);
				additions.push({
					...emptyRow,
					repository: repo,
					label: inferred.label,
					vendor: inferred.vendor ?? "",
					model: inferred.model ?? "",
					kind: inferred.kind,
					role: inferred.role ?? "other",
				});
				seen.add(repo);
			}
			if (additions.length === 0) return prev;
			toast.success(`Added ${additions.length} discovered repo(s) to catalog draft`);
			return [...prev, ...additions];
		});
	};

	const saveRegistryCatalog = useMutation({
		mutationFn: async () => {
			const prefixes = registryRepoPrefixesDraft
				.split(/[,\n;]/)
				.map((value) => value.trim())
				.filter(Boolean);
			return putAdminRegistryCatalog({
				baseUrl: registryBaseURLDraft.trim(),
				skipTlsVerify: registrySkipTLSVerifyDraft,
				repoPrefixes: prefixes,
				username: registryUsernameDraft.trim() || undefined,
				password: registryPasswordDraft.trim() || undefined,
				prepullWorkerNodes: registryPrepullWorkerNodesDraft,
				images: registryCatalogImagesDraft,
			});
		},
		onSuccess: async () => {
			toast.success("Saved registry catalog settings");
			setRegistryPasswordDraft("");
			await Promise.all([
				refetchRegistryCatalog(),
				queryClient.invalidateQueries({ queryKey: queryKeys.registryCatalog() }),
				queryClient.invalidateQueries({ queryKey: queryKeys.registryRepos("") }),
			]);
		},
		onError: (e) => {
			toast.error("Failed to save registry catalog settings", {
				description: (e as Error).message,
			});
		},
	});

	const triggerRegistryCatalogPrepull = useMutation({
		mutationFn: async () => triggerAdminRegistryCatalogPrepull(),
		onSuccess: async (resp) => {
			toast.success("Started worker image pre-pull", {
				description: `${resp.imageCount} images via ${resp.daemonSet} (${resp.namespace})`,
			});
			await refetchRegistryCatalog();
		},
		onError: (e) => {
			toast.error("Failed to run worker image pre-pull", {
				description: (e as Error).message,
			});
		},
	});

	return {
		registryBaseURLDraft,
		setRegistryBaseURLDraft,
		registrySkipTLSVerifyDraft,
		setRegistrySkipTLSVerifyDraft,
		registryRepoPrefixesDraft,
		setRegistryRepoPrefixesDraft,
		registryUsernameDraft,
		setRegistryUsernameDraft,
		registryPasswordDraft,
		setRegistryPasswordDraft,
		registryPrepullWorkerNodesDraft,
		setRegistryPrepullWorkerNodesDraft,
		registryCatalogImagesDraft,
		setRegistryCatalogImagesDraft,
		discoveredRepos,
		missingCatalogRepos,
		disabledDiscoveredRepos,
		upsertRegistryCatalogImage,
		addRegistryCatalogImage,
		removeRegistryCatalogImage,
		addMissingRegistryReposToCatalogDraft,
		saveRegistryCatalog,
		triggerRegistryCatalogPrepull,
	};
}

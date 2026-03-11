import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type UserForwardCollectorConfigSummary,
	createUserForwardCollectorConfig,
	deleteUserForwardCollectorConfig,
	getUserForwardCollectorConfigLogs,
	getUserForwardCollectorConfigUpdate,
	getUserGitCredentials,
	listUserForwardCollectorConfigs,
	restartUserForwardCollectorConfig,
	upgradeUserForwardCollectorConfig,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export type ForwardTarget = "cloud" | "onprem";

function normalizeBaseURL(target: ForwardTarget, onPremHost: string): string {
	if (target === "cloud") {
		return "https://fwd-appserver.forward.svc.cluster.local";
	}
	const raw = onPremHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

export function useForwardCollectorsPage() {
	const queryClient = useQueryClient();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();

	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		refetchInterval: 5000,
		staleTime: 10_000,
		retry: false,
	});

	const collectors = useMemo(
		() =>
			(collectorsQ.data?.collectors ??
				[]) as UserForwardCollectorConfigSummary[],
		[collectorsQ.data?.collectors],
	);

	const [showLogsId, setShowLogsId] = useState("");
	const logsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigLogs(showLogsId),
		queryFn: async () => getUserForwardCollectorConfigLogs(showLogsId, 300),
		enabled: !!showLogsId,
		refetchInterval: showLogsId ? 3000 : false,
		retry: false,
	});

	const [target, setTarget] = useState<ForwardTarget>("cloud");
	const [onPremHost, setOnPremHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(true);
	const [collectorName, setCollectorName] = useState("");
	const [collectorNameTouched, setCollectorNameTouched] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [setDefault, setSetDefault] = useState(true);

	const userGitQ = useQuery({
		queryKey: queryKeys.userGitCredentials(),
		queryFn: getUserGitCredentials,
		staleTime: 60_000,
		retry: false,
	});

	useEffect(() => {
		if (collectorNameTouched || collectorName.trim()) return;
		const username = (userGitQ.data?.username ?? "").trim();
		if (!username) return;
		setCollectorName(`skyforge-${username}`);
	}, [collectorNameTouched, collectorName, userGitQ.data?.username]);

	const createMutation = useMutation({
		mutationFn: async () => {
			const name = collectorName.trim();
			if (!name) throw new Error("Collector name is required");
			const baseUrl = normalizeBaseURL(target, onPremHost);
			if (!baseUrl) throw new Error("Forward URL is required");
			if (!username.trim() || !password.trim()) {
				throw new Error("Forward username/password are required");
			}
			return createUserForwardCollectorConfig({
				name,
				baseUrl,
				skipTlsVerify: target === "onprem" ? skipTlsVerify : true,
				username: username.trim(),
				password,
				setDefault,
			});
		},
		onSuccess: async () => {
			toast.success("Collector created");
			setPassword("");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to create collector", {
				description: (error as Error).message,
			}),
	});

	const restartMutation = useMutation({
		mutationFn: async (id: string) => restartUserForwardCollectorConfig(id),
		onSuccess: async () => {
			toast.success("Collector restarted");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to restart collector", {
				description: (error as Error).message,
			}),
	});

	const checkUpdatesMutation = useMutation({
		mutationFn: async () => {
			const results = await Promise.allSettled(
				collectors.map((collector) =>
					getUserForwardCollectorConfigUpdate(collector.id),
				),
			);
			let available = 0;
			for (const result of results) {
				if (result.status === "fulfilled" && result.value.updateAvailable) {
					available += 1;
				}
			}
			return { available, total: collectors.length };
		},
		onSuccess: async ({ available, total }) => {
			toast.success(
				available > 0
					? `${available} collector update(s) available`
					: "All collectors are up to date",
				{
					description:
						total > 0
							? `Checked ${total} collector(s)`
							: "No collectors configured",
				},
			);
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to check collector updates", {
				description: (error as Error).message,
			}),
	});

	const upgradeMutation = useMutation({
		mutationFn: async (id: string) => upgradeUserForwardCollectorConfig(id),
		onSuccess: async (resp) => {
			if (resp.upgraded) {
				toast.success("Collector upgraded", {
					description: resp.updatedImage
						? `Now using ${resp.updatedImage}`
						: undefined,
				});
			} else {
				toast.success("Collector already up to date");
			}
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to upgrade collector", {
				description: (error as Error).message,
			}),
	});

	const upgradeAllMutation = useMutation({
		mutationFn: async () => {
			const updates = await Promise.allSettled(
				collectors.map((collector) =>
					upgradeUserForwardCollectorConfig(collector.id),
				),
			);
			let upgraded = 0;
			let failed = 0;
			for (const result of updates) {
				if (result.status === "fulfilled") {
					if (result.value.upgraded) upgraded += 1;
				} else {
					failed += 1;
				}
			}
			return { upgraded, failed, total: collectors.length };
		},
		onSuccess: async ({ upgraded, failed, total }) => {
			if (failed > 0) {
				toast.error("Collector upgrade completed with failures", {
					description: `${upgraded} upgraded, ${failed} failed, ${total} checked`,
				});
			} else {
				toast.success("Collector upgrades complete", {
					description: `${upgraded} upgraded, ${total - upgraded} already current`,
				});
			}
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to run collector upgrades", {
				description: (error as Error).message,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCollectorConfig(id),
		onSuccess: async (_data, id) => {
			toast.success("Collector deleted");
			setShowLogsId("");
			queryClient.setQueryData(collectorsKey, (prev: any) => {
				const prevCollectors = (prev?.collectors ??
					[]) as UserForwardCollectorConfigSummary[];
				return {
					...(prev ?? {}),
					collectors: prevCollectors.filter(
						(collector) => String(collector?.id ?? "") !== String(id),
					),
				};
			});
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to delete collector", {
				description: (error as Error).message,
			}),
	});

	const deleteAllMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			for (const id of ids) {
				await deleteUserForwardCollectorConfig(id);
			}
		},
		onSuccess: async () => {
			toast.success("Collectors deleted");
			setShowLogsId("");
			queryClient.setQueryData(collectorsKey, (prev: any) => ({
				...(prev ?? {}),
				collectors: [],
			}));
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (error) =>
			toast.error("Failed to delete collectors", {
				description: (error as Error).message,
			}),
	});

	return {
		collectorsKey,
		collectorsQ,
		collectors,
		showLogsId,
		setShowLogsId,
		logsQ,
		target,
		setTarget,
		onPremHost,
		setOnPremHost,
		skipTlsVerify,
		setSkipTlsVerify,
		collectorName,
		setCollectorName,
		setCollectorNameTouched,
		username,
		setUsername,
		password,
		setPassword,
		setDefault,
		setSetDefault,
		createMutation,
		restartMutation,
		checkUpdatesMutation,
		upgradeMutation,
		upgradeAllMutation,
		deleteMutation,
		deleteAllMutation,
	};
}

export type ForwardCollectorsPageState = ReturnType<
	typeof useForwardCollectorsPage
>;

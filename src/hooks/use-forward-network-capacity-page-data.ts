import {
	type ForwardNetworkCapacityCoverageResponse,
	type ForwardNetworkCapacityInventoryResponse,
	type ForwardNetworkCapacitySnapshotDeltaResponse,
	type ForwardNetworkCapacityUpgradeCandidatesResponse,
	getForwardNetworkCapacityCoverage,
	getForwardNetworkCapacityInventory,
	getForwardNetworkCapacitySnapshotDelta,
	getForwardNetworkCapacitySummary,
	getForwardNetworkCapacityUnhealthyDevices,
	getForwardNetworkCapacityUpgradeCandidates,
	listUserScopeForwardNetworks,
	refreshForwardNetworkCapacityRollups,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

export function useForwardNetworkCapacityPageData(args: {
	ownerUserId: string;
	networkRefId: string;
	windowLabel: "24h" | "7d" | "30d";
	setUnhealthyDevices: (value: unknown) => void;
}) {
	const { ownerUserId, networkRefId, windowLabel, setUnhealthyDevices } = args;
	const qc = useQueryClient();

	const networksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(ownerUserId),
		queryFn: () => listUserScopeForwardNetworks(ownerUserId),
		enabled: Boolean(ownerUserId),
		retry: false,
		staleTime: 30_000,
	});

	const networkName = useMemo(() => {
		const ns = (networksQ.data?.networks ?? []) as any[];
		const hit = ns.find((n) => String(n?.id ?? "") === networkRefId);
		return String(hit?.name ?? "");
	}, [networksQ.data?.networks, networkRefId]);

	const summary = useQuery({
		queryKey: queryKeys.forwardNetworkCapacitySummary(
			ownerUserId,
			networkRefId,
		),
		queryFn: () => getForwardNetworkCapacitySummary(ownerUserId, networkRefId),
		enabled: Boolean(ownerUserId && networkRefId),
		retry: false,
		staleTime: 30_000,
	});

	const inventory = useQuery<ForwardNetworkCapacityInventoryResponse>({
		queryKey: queryKeys.forwardNetworkCapacityInventory(
			ownerUserId,
			networkRefId,
		),
		queryFn: () =>
			getForwardNetworkCapacityInventory(ownerUserId, networkRefId),
		enabled: Boolean(ownerUserId && networkRefId),
		retry: false,
		staleTime: 30_000,
	});

	const coverage = useQuery<ForwardNetworkCapacityCoverageResponse>({
		queryKey: queryKeys.forwardNetworkCapacityCoverage(
			ownerUserId,
			networkRefId,
		),
		queryFn: () => getForwardNetworkCapacityCoverage(ownerUserId, networkRefId),
		enabled: Boolean(ownerUserId && networkRefId),
		retry: false,
		staleTime: 30_000,
	});

	const snapshotDelta = useQuery<ForwardNetworkCapacitySnapshotDeltaResponse>({
		queryKey: queryKeys.forwardNetworkCapacitySnapshotDelta(
			ownerUserId,
			networkRefId,
		),
		queryFn: () =>
			getForwardNetworkCapacitySnapshotDelta(ownerUserId, networkRefId),
		enabled: Boolean(ownerUserId && networkRefId),
		retry: false,
		staleTime: 30_000,
	});

	const upgradeCandidates =
		useQuery<ForwardNetworkCapacityUpgradeCandidatesResponse>({
			queryKey: queryKeys.forwardNetworkCapacityUpgradeCandidates(
				ownerUserId,
				networkRefId,
				windowLabel,
			),
			queryFn: () =>
				getForwardNetworkCapacityUpgradeCandidates(ownerUserId, networkRefId, {
					window: windowLabel,
				}),
			enabled: Boolean(ownerUserId && networkRefId),
			retry: false,
			staleTime: 30_000,
		});

	const forwardNetworkId = String(
		summary.data?.forwardNetworkId ?? inventory.data?.forwardNetworkId ?? "",
	);

	const ifaceInvIndex = useMemo(() => {
		const m = new Map<
			string,
			{ aggregateId?: string; interfaceType?: string }
		>();
		for (const r of inventory.data?.interfaces ?? []) {
			const dev = String(r.deviceName ?? "").trim();
			const ifn = String(r.interfaceName ?? "").trim();
			if (!dev || !ifn) continue;
			const agg = String(r.aggregateId ?? "").trim();
			const typ = String(r.interfaceType ?? "").trim();
			m.set(`${dev}|${ifn}`, {
				aggregateId: agg || undefined,
				interfaceType: typ || undefined,
			});
		}
		return m;
	}, [inventory.data?.interfaces]);

	const refresh = useMutation({
		mutationFn: async () => {
			if (!ownerUserId) throw new Error("user not found");
			return refreshForwardNetworkCapacityRollups(ownerUserId, networkRefId);
		},
		onSuccess: async (resp) => {
			toast.success("Refresh queued", {
				description: `Run ${String(resp.run?.id ?? "")}`.trim(),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacitySummary(
					ownerUserId,
					networkRefId,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacityInventory(
					ownerUserId,
					networkRefId,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacityCoverage(
					ownerUserId,
					networkRefId,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacitySnapshotDelta(
					ownerUserId,
					networkRefId,
				),
			});
			await qc.invalidateQueries({
				queryKey: [
					"forwardNetworkCapacityUpgradeCandidates",
					ownerUserId,
					networkRefId,
				],
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.userForwardNetworkCapacityPortfolio(ownerUserId),
			});
			await qc.invalidateQueries({
				queryKey: ["forwardNetworkCapacityGrowth", ownerUserId, networkRefId],
			});
		},
		onError: (e) =>
			toast.error("Failed to refresh", { description: (e as Error).message }),
	});

	const loadUnhealthyDevices = useMutation({
		mutationFn: async () =>
			getForwardNetworkCapacityUnhealthyDevices(ownerUserId, networkRefId, {}),
		onSuccess: (resp) => setUnhealthyDevices(resp.body),
		onError: (e) =>
			toast.error("Failed to load unhealthy devices", {
				description: (e as Error).message,
			}),
	});

	const groupingOptions = useMemo(() => {
		const devices = inventory.data?.devices ?? [];
		const ifaceVrfs = inventory.data?.interfaceVrfs ?? [];
		const tags = new Set<string>();
		const groups = new Set<string>();
		const locations = new Set<string>();
		const vrfs = new Set<string>();
		for (const d of devices) {
			for (const t of d.tagNames ?? []) {
				const tt = String(t ?? "").trim();
				if (tt) tags.add(tt);
			}
			for (const g of d.groupNames ?? []) {
				const gg = String(g ?? "").trim();
				if (gg) groups.add(gg);
			}
			const loc = String(d.locationName ?? "").trim();
			if (loc) locations.add(loc);
		}
		for (const r of ifaceVrfs) {
			const v = String(r.vrf ?? "").trim();
			if (v) vrfs.add(v);
		}
		return {
			tags: Array.from(tags).sort(),
			groups: Array.from(groups).sort(),
			locations: Array.from(locations).sort(),
			vrfs: Array.from(vrfs).sort(),
		};
	}, [inventory.data?.devices, inventory.data?.interfaceVrfs]);

	const windowDays = windowLabel === "24h" ? 1 : windowLabel === "7d" ? 7 : 30;
	const rollups = summary.data?.rollups ?? [];

	return {
		networksQ,
		networkName,
		summary,
		inventory,
		coverage,
		snapshotDelta,
		upgradeCandidates,
		forwardNetworkId,
		ifaceInvIndex,
		refresh,
		loadUnhealthyDevices,
		groupingOptions,
		windowDays,
		rollups,
	};
}

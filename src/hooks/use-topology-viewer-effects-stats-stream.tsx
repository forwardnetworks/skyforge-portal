import type { LinkStatsSnapshot } from "@/lib/api-client";
import { getDeploymentLinkStats } from "@/lib/api-client";
import { useEffect } from "react";
import type { TopologyViewerStatsStreamEffectsArgs } from "./use-topology-viewer-effects-types";

export function useTopologyViewerStatsStreamEffects(
	args: TopologyViewerStatsStreamEffectsArgs,
) {
	const {
		userId,
		deploymentId,
		statsEnabled,
		lastStatsRef,
		setStatsError,
		setEdgeRates,
	} = args;

	useEffect(() => {
		if (!statsEnabled || !userId || !deploymentId) return;
		setStatsError(null);
		lastStatsRef.current = null;

		const url = `/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/links/stats/events`;
		const eventSource = new EventSource(url, { withCredentials: true });

		const onStats = (event: MessageEvent) => {
			try {
				const payload = JSON.parse(String(event.data ?? "{}")) as {
					type?: string;
					snapshot?: LinkStatsSnapshot;
					error?: string;
				};
				if (payload.type === "error") {
					setStatsError(payload.error || "failed to stream link stats");
					return;
				}
				if (payload.type !== "snapshot" || !payload.snapshot) return;

				const snapshot = payload.snapshot;
				const atMs = Date.parse(snapshot.generatedAt || "");
				if (!Number.isFinite(atMs)) return;
				const byEdge: Record<string, LinkStatsSnapshot["edges"][number]> = {};
				for (const edge of snapshot.edges ?? []) {
					byEdge[String(edge.edgeId)] = edge;
				}

				const prev = lastStatsRef.current;
				lastStatsRef.current = { atMs, byEdge };
				if (!prev) return;

				const dt = (atMs - prev.atMs) / 1000;
				if (!(dt > 0)) return;

				const rates: Record<
					string,
					{ bps: number; pps: number; drops: number }
				> = {};
				for (const [edgeId, cur] of Object.entries(byEdge)) {
					const prevEdge = prev.byEdge[edgeId];
					if (!prevEdge) continue;
					const delta = (a: number, b: number) => Math.max(0, a - b);

					const srcTx = delta(cur.sourceTxBytes, prevEdge.sourceTxBytes);
					const srcRx = delta(cur.sourceRxBytes, prevEdge.sourceRxBytes);
					const dstTx = delta(cur.targetTxBytes, prevEdge.targetTxBytes);
					const dstRx = delta(cur.targetRxBytes, prevEdge.targetRxBytes);
					const bytes = Math.max(srcTx, dstRx) + Math.max(dstTx, srcRx);

					const srcTxPk = delta(cur.sourceTxPackets, prevEdge.sourceTxPackets);
					const srcRxPk = delta(cur.sourceRxPackets, prevEdge.sourceRxPackets);
					const dstTxPk = delta(cur.targetTxPackets, prevEdge.targetTxPackets);
					const dstRxPk = delta(cur.targetRxPackets, prevEdge.targetRxPackets);
					const pps =
						(Math.max(srcTxPk, dstRxPk) + Math.max(dstTxPk, srcRxPk)) / dt;

					const drops =
						(delta(cur.sourceRxDropped, prevEdge.sourceRxDropped) +
							delta(cur.sourceTxDropped, prevEdge.sourceTxDropped) +
							delta(cur.targetRxDropped, prevEdge.targetRxDropped) +
							delta(cur.targetTxDropped, prevEdge.targetTxDropped)) /
						dt;

					rates[edgeId] = { bps: (bytes * 8) / dt, pps, drops };
				}
				setEdgeRates(rates);
			} catch (error: any) {
				setStatsError(error?.message ?? String(error));
			}
		};

		const onError = () => setStatsError("link stats stream disconnected");

		eventSource.addEventListener("stats", onStats as EventListener);
		eventSource.onerror = onError;
		void getDeploymentLinkStats(userId, deploymentId).catch(() => {});

		return () => {
			eventSource.removeEventListener("stats", onStats as EventListener);
			eventSource.close();
		};
	}, [
		deploymentId,
		lastStatsRef,
		setEdgeRates,
		setStatsError,
		statsEnabled,
		userId,
	]);
}

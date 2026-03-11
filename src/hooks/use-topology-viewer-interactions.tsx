import {
	captureDeploymentLinkPcap,
	downloadUserScopeArtifact,
	getDeploymentInventory,
	getDeploymentNodeInterfaces,
	getDeploymentNodeRunningConfig,
	setDeploymentLinkAdmin,
	setDeploymentLinkImpairment,
} from "@/lib/api-client";
import { saveDeploymentNodeConfig } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { type Connection, type Edge, type Node, addEdge } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";

export function useTopologyViewerInteractions(args: {
	userId?: string;
	deploymentId?: string;
	ref: React.RefObject<HTMLDivElement | null>;
	setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
	setNodeMenu: React.Dispatch<
		React.SetStateAction<{ x: number; y: number; node: Node } | null>
	>;
	setEdgeMenu: React.Dispatch<
		React.SetStateAction<{ x: number; y: number; edge: Edge } | null>
	>;
	impair: {
		delayMs: string;
		jitterMs: string;
		lossPct: string;
		dupPct: string;
		corruptPct: string;
		reorderPct: string;
		rateKbps: string;
	};
	setImpairSaving: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const {
		userId,
		deploymentId,
		ref,
		setEdges,
		setNodeMenu,
		setEdgeMenu,
		impair,
		setImpairSaving,
	} = args;

	const saveConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!userId || !deploymentId)
				throw new Error("missing user-scope/deployment");
			return saveDeploymentNodeConfig(userId, deploymentId, nodeId);
		},
		onSuccess: (resp, nodeId) => {
			if (resp?.skipped) {
				toast.message("Save config skipped", {
					description: resp.message || `Node ${nodeId}`,
				});
				return;
			}
			toast.success("Save config queued/applied", {
				description: resp.stdout || `Node ${nodeId}`,
			});
		},
		onError: (e: any) => {
			toast.error("Save config failed", {
				description: e?.message ?? String(e),
			});
		},
	});

	const linkAdmin = useMutation({
		mutationFn: async (payload: { edgeId: string; action: "up" | "down" }) => {
			if (!userId || !deploymentId)
				throw new Error("missing user-scope/deployment");
			return setDeploymentLinkAdmin(userId, deploymentId, payload);
		},
		onSuccess: (resp) => {
			const failed = resp.results.filter((r) => r.error);
			if (failed.length) {
				toast.error("Link admin applied with errors", {
					description: failed.map((r) => `${r.node}: ${r.error}`).join("; "),
				});
				return;
			}
			toast.success(`Link ${resp.action} applied`);
		},
		onError: (e: any) =>
			toast.error("Link admin failed", {
				description: e?.message ?? String(e),
			}),
	});

	const captureLink = useMutation({
		mutationFn: async (payload: {
			edgeId: string;
			side: "source" | "target";
			durationSeconds: number;
			maxPackets: number;
			snaplen: number;
		}) => {
			if (!userId || !deploymentId)
				throw new Error("missing user-scope/deployment");
			return captureDeploymentLinkPcap(userId, deploymentId, payload);
		},
		onSuccess: (resp) => {
			toast.success("Pcap captured", {
				description: `${resp.sizeBytes} bytes • ${resp.artifactKey}`,
			});
		},
		onError: (e: any) =>
			toast.error("Pcap capture failed", {
				description: e?.message ?? String(e),
			}),
	});

	const fetchInterfaces = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!userId || !deploymentId)
				throw new Error("missing user-scope/deployment");
			return getDeploymentNodeInterfaces(userId, deploymentId, nodeId);
		},
		onError: (e: any) =>
			toast.error("Failed to load interfaces", {
				description: e?.message ?? String(e),
			}),
	});

	const fetchRunningConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!userId || !deploymentId)
				throw new Error("missing user-scope/deployment");
			return getDeploymentNodeRunningConfig(userId, deploymentId, nodeId);
		},
		onError: (e: any) =>
			toast.error("Failed to load running config", {
				description: e?.message ?? String(e),
			}),
	});

	const downloadPcap = useCallback(
		async (key: string) => {
			if (!userId) return;
			const resp = await downloadUserScopeArtifact(userId, key);
			const b64 = String((resp as any)?.fileData ?? "");
			if (!b64) throw new Error("missing fileData");
			const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
			const blob = new Blob([bytes], { type: "application/vnd.tcpdump.pcap" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = key.split("/").pop() || "capture.pcap";
			a.click();
			URL.revokeObjectURL(url);
		},
		[userId],
	);

	const downloadInventory = useCallback(async () => {
		if (!userId || !deploymentId) return;
		const resp = await getDeploymentInventory(userId, deploymentId, "csv");
		const csv = String(resp.csv ?? "");
		if (!csv.trim()) throw new Error("empty inventory csv");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${deploymentId}-inventory.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [deploymentId, userId]);

	const onConnect = useCallback(
		(params: Connection) => setEdges((edges) => addEdge(params, edges)),
		[setEdges],
	);

	const onNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			event.preventDefault();
			if (!userId || !deploymentId) return;
			const rect = ref.current?.getBoundingClientRect();
			const x = rect ? event.clientX - rect.left : event.clientX;
			const y = rect ? event.clientY - rect.top : event.clientY;
			setNodeMenu({ x, y, node });
		},
		[deploymentId, ref, setNodeMenu, userId],
	);

	const onEdgeContextMenu = useCallback(
		(event: React.MouseEvent, edge: Edge) => {
			event.preventDefault();
			if (!userId || !deploymentId) return;
			const rect = ref.current?.getBoundingClientRect();
			const x = rect ? event.clientX - rect.left : event.clientX;
			const y = rect ? event.clientY - rect.top : event.clientY;
			setEdgeMenu({ x, y, edge });
		},
		[deploymentId, ref, setEdgeMenu, userId],
	);

	const applyImpairment = useCallback(
		async (action: "set" | "clear", edgeId: string) => {
			if (!userId || !deploymentId) return;
			try {
				setImpairSaving(true);
				const body: Record<string, unknown> = { edgeId, action };
				if (action === "set") {
					const delayMs = impair.delayMs.trim()
						? Number(impair.delayMs.trim())
						: undefined;
					const jitterMs = impair.jitterMs.trim()
						? Number(impair.jitterMs.trim())
						: undefined;
					const lossPct = impair.lossPct.trim()
						? Number(impair.lossPct.trim())
						: undefined;
					const dupPct = impair.dupPct.trim()
						? Number(impair.dupPct.trim())
						: undefined;
					const corruptPct = impair.corruptPct.trim()
						? Number(impair.corruptPct.trim())
						: undefined;
					const reorderPct = impair.reorderPct.trim()
						? Number(impair.reorderPct.trim())
						: undefined;
					const rateKbps = impair.rateKbps.trim()
						? Number(impair.rateKbps.trim())
						: undefined;
					if (Number.isFinite(delayMs)) body.delayMs = delayMs;
					if (Number.isFinite(jitterMs)) body.jitterMs = jitterMs;
					if (Number.isFinite(lossPct)) body.lossPct = lossPct;
					if (Number.isFinite(dupPct)) body.dupPct = dupPct;
					if (Number.isFinite(corruptPct)) body.corruptPct = corruptPct;
					if (Number.isFinite(reorderPct)) body.reorderPct = reorderPct;
					if (Number.isFinite(rateKbps)) body.rateKbps = rateKbps;
				}
				const resp = await setDeploymentLinkImpairment(
					userId,
					deploymentId,
					body as any,
				);
				const failed = resp.results.filter((r) => r.error);
				if (failed.length) {
					toast.error("Link impairment applied with errors", {
						description: failed.map((r) => `${r.node}: ${r.error}`).join("; "),
					});
				} else {
					toast.success(
						action === "clear"
							? "Link impairment cleared"
							: "Link impairment applied",
					);
				}
			} catch (e: any) {
				toast.error("Failed to apply link impairment", {
					description: e?.message ?? String(e),
				});
			} finally {
				setImpairSaving(false);
			}
		},
		[deploymentId, impair, setImpairSaving, userId],
	);

	return {
		saveConfig,
		linkAdmin,
		captureLink,
		fetchInterfaces,
		fetchRunningConfig,
		downloadPcap,
		downloadInventory,
		onConnect,
		onNodeContextMenu,
		onEdgeContextMenu,
		applyImpairment,
	};
}

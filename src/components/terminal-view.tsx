import { FitAddon } from "@xterm/addon-fit";
import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { Button } from "@/components/ui/button";
import { SKYFORGE_PROXY_ROOT } from "@/lib/skyforge-api";
import { userContextRelativePath } from "@/lib/user-context-path";

type Props = {
	userContextId: string;
	deploymentId: string;
	nodeId: string;
	nodeKind?: string;
	onClose?: () => void;
	className?: string;
};

type ServerMsg = { type: string; data?: string; stream?: string };

export function TerminalView({
	userContextId,
	deploymentId,
	nodeId,
	nodeKind,
	onClose,
	className,
}: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const termRef = useRef<XTerm | null>(null);
	const fitRef = useRef<FitAddon | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const [status, setStatus] = useState<string>("disconnected");

	const command = useMemo(() => {
		// `cli` is a semantic default: the server will translate it into the
		// correct in-container command (vrnetlab console, cEOS Cli, or shell fallback).
		return "cli";
	}, []);

	const wsURL = useMemo(() => {
		if (!userContextId || !deploymentId || !nodeId) return "";
		const proto = window.location.protocol === "https:" ? "wss" : "ws";
		const base = `${proto}://${window.location.host}${SKYFORGE_PROXY_ROOT}${userContextRelativePath(
			userContextId,
			`/deployments/${encodeURIComponent(deploymentId)}/terminal/ws`,
		)}`;
		const params = new URLSearchParams();
		params.set("node", nodeId);
		params.set("command", command);
		return `${base}?${params.toString()}`;
	}, [command, deploymentId, nodeId, userContextId]);

	useEffect(() => {
		if (!containerRef.current) return;
		if (!wsURL) return;

		const term = new XTerm({
			convertEol: true,
			cursorBlink: true,
			fontFamily:
				"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
			fontSize: 12,
			theme: {
				background: "#09090b",
			},
		});
		const fit = new FitAddon();
		term.loadAddon(fit);
		term.open(containerRef.current);
		fit.fit();

		term.writeln("\x1b[1mSkyforge Terminal\x1b[0m");
		term.writeln(`Node: ${nodeId}  Command: ${command}`);
		term.writeln("");

		termRef.current = term;
		fitRef.current = fit;

		const ws = new WebSocket(wsURL);
		wsRef.current = ws;
		setStatus("connecting");

		const sendResize = () => {
			const t = termRef.current;
			if (!t) return;
			const cols = t.cols ?? 80;
			const rows = t.rows ?? 24;
			try {
				ws.send(JSON.stringify({ type: "resize", cols, rows }));
			} catch {
				// ignore
			}
		};

		ws.onopen = () => {
			setStatus("connected");
			sendResize();
			term.focus();
		};
		ws.onmessage = (ev) => {
			let msg: ServerMsg | null = null;
			try {
				msg = JSON.parse(String(ev.data)) as ServerMsg;
			} catch {
				term.write(String(ev.data));
				return;
			}
			if (!msg) return;
			if (msg.type === "output") {
				term.write(msg.data ?? "");
				return;
			}
			if (msg.type === "info") {
				term.writeln(`\r\n[info] ${msg.data ?? ""}`);
				return;
			}
			if (msg.type === "error") {
				term.writeln(`\r\n[error] ${msg.data ?? ""}`);
				return;
			}
		};
		ws.onclose = (ev) => {
			setStatus("closed");
			const code = typeof ev.code === "number" ? ev.code : 0;
			const reason = ev.reason ? ` ${ev.reason}` : "";
			term.writeln(
				`\r\n[disconnected]${code ? ` (code ${code})` : ""}${reason}`,
			);
		};
		ws.onerror = () => {
			setStatus("error");
			term.writeln(
				"\r\n[error] websocket error (check browser console/network)",
			);
		};

		const disposeData = term.onData((data) => {
			try {
				ws.send(JSON.stringify({ type: "stdin", data }));
			} catch {
				// ignore
			}
		});

		const onResize = () => {
			fit.fit();
			sendResize();
		};
		window.addEventListener("resize", onResize);

		return () => {
			window.removeEventListener("resize", onResize);
			disposeData.dispose();
			try {
				ws.close();
			} catch {
				// ignore
			}
			wsRef.current = null;
			term.dispose();
			termRef.current = null;
			fitRef.current = null;
			setStatus("disconnected");
		};
	}, [command, nodeId, wsURL]);

	return (
		<div className={`flex flex-col h-full w-full ${className ?? ""}`}>
			<div className="flex items-center justify-between gap-2 p-2 text-xs text-muted-foreground bg-zinc-900 border-b border-zinc-800">
				<div className="truncate">
					<span className="font-mono text-zinc-300">{nodeId}</span>
					<span className="mx-2 text-zinc-600">/</span>
					<span>{status}</span>
				</div>
				{onClose ? (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={() => {
							const ws = wsRef.current;
							if (ws && ws.readyState === WebSocket.OPEN) {
								try {
									ws.close();
								} catch {
									// ignore
								}
							}
							onClose();
						}}
					>
						Close
					</Button>
				) : null}
			</div>
			<div className="flex-1 bg-zinc-950 p-2 min-h-0">
				<div ref={containerRef} className="h-full w-full" />
			</div>
		</div>
	);
}

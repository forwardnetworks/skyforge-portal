import { FitAddon } from "@xterm/addon-fit";
import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { Button } from "@/components/ui/button";

type ServerMsg = { type: string; data?: string; stream?: string };

type WebsocketTerminalProps = {
	wsURL: string;
	headerTitle: string;
	headerSubtitle?: string;
	startupLines?: string[];
	disconnectLabel?: string;
	onDisconnect?: () => void;
	className?: string;
};

export function WebsocketTerminal({
	wsURL,
	headerTitle,
	headerSubtitle,
	startupLines,
	disconnectLabel = "Disconnect",
	onDisconnect,
	className,
}: WebsocketTerminalProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const termRef = useRef<XTerm | null>(null);
	const fitRef = useRef<FitAddon | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const [status, setStatus] = useState("disconnected");

	useEffect(() => {
		if (!containerRef.current) return;
		if (!wsURL) return;

		const term = new XTerm({
			convertEol: true,
			cursorBlink: true,
			fontFamily:
				"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
			fontSize: 12,
			theme: { background: "#09090b" },
		});
		const fit = new FitAddon();
		term.loadAddon(fit);
		term.open(containerRef.current);
		fit.fit();
		term.writeln(`\x1b[1m${headerTitle}\x1b[0m`);
		for (const line of startupLines ?? []) {
			term.writeln(line);
		}
		term.writeln("");

		termRef.current = term;
		fitRef.current = fit;

		const ws = new WebSocket(wsURL);
		wsRef.current = ws;
		setStatus("connecting");

		const sendResize = () => {
			const t = termRef.current;
			if (!t) return;
			try {
				ws.send(
					JSON.stringify({
						type: "resize",
						cols: t.cols ?? 120,
						rows: t.rows ?? 35,
					}),
				);
			} catch {
				// ignore
			}
		};

		ws.onopen = () => {
			setStatus("connected");
			sendResize();
			term.focus();
		};
		ws.onmessage = (event) => {
			let msg: ServerMsg | null = null;
			try {
				msg = JSON.parse(String(event.data)) as ServerMsg;
			} catch {
				term.write(String(event.data));
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
			}
		};
		ws.onclose = (event) => {
			setStatus("closed");
			const code = typeof event.code === "number" ? event.code : 0;
			const reason = event.reason ? ` ${event.reason}` : "";
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

		const input = term.onData((data) => {
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
			input.dispose();
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
	}, [headerTitle, startupLines, wsURL]);

	return (
		<div className={`flex h-full w-full flex-col ${className ?? ""}`}>
			<div className="flex items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900 p-2 text-xs text-muted-foreground">
				<div>
					{headerSubtitle ? `${headerSubtitle} / ` : ""}
					{status}
				</div>
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
						onDisconnect?.();
					}}
				>
					{disconnectLabel}
				</Button>
			</div>
			<div className="min-h-0 flex-1 bg-zinc-950 p-2">
				<div ref={containerRef} className="h-full w-full" />
			</div>
		</div>
	);
}

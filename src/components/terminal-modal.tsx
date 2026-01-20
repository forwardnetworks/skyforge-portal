import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { SKYFORGE_PROXY_ROOT } from "@/lib/skyforge-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  deploymentId: string;
  nodeId: string;
  nodeKind?: string;
};

type ServerMsg = { type: string; data?: string; stream?: string };

export function TerminalModal({ open, onOpenChange, workspaceId, deploymentId, nodeId, nodeKind }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<string>("disconnected");

  const command = useMemo(() => {
    const k = String(nodeKind ?? "").toLowerCase();
    // Arista cEOS in our clabernetes native mode ships without the `Cli` binary but
    // includes `CliShell` and `FastCli`.
    if (k.includes("eos") || k.includes("ceos")) return "CliShell";
    return "sh";
  }, [nodeKind]);

  const wsURL = useMemo(() => {
    if (!workspaceId || !deploymentId || !nodeId) return "";
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const base = `${proto}://${window.location.host}${SKYFORGE_PROXY_ROOT}/api/workspaces/${encodeURIComponent(
      workspaceId
    )}/deployments/${encodeURIComponent(deploymentId)}/terminal/ws`;
    const params = new URLSearchParams();
    params.set("node", nodeId);
    params.set("command", command);
    return `${base}?${params.toString()}`;
  }, [command, deploymentId, nodeId, workspaceId]);

  useEffect(() => {
    if (!open) return;
    if (!containerRef.current) return;
    if (!wsURL) return;

    const term = new XTerm({
      convertEol: true,
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
    ws.onclose = () => {
      setStatus("closed");
      term.writeln("\r\n[disconnected]");
    };
    ws.onerror = () => {
      setStatus("error");
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
  }, [command, nodeId, open, wsURL]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="truncate">
            <span className="font-mono">{workspaceId}</span> / <span className="font-mono">{deploymentId}</span> /{" "}
            <span className="font-mono">{nodeId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Status: {status}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ws = wsRef.current;
                if (ws && ws.readyState === WebSocket.OPEN) {
                  try {
                    ws.close();
                  } catch {
                    // ignore
                  }
                }
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-zinc-950 p-2">
          <div ref={containerRef} className="h-[65vh] w-full" />
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: Right-click a node in the topology to open the terminal.
        </div>
      </DialogContent>
    </Dialog>
  );
}

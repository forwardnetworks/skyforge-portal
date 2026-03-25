import type { PaletteItem } from "@/components/lab-designer-types";
import { Server, Shield, Waypoints } from "lucide-react";

export const paletteMimeType = "application/x-skyforge-palette-item";

export function inferPaletteItemFromRepo(repo: string): PaletteItem {
	const clean = String(repo ?? "")
		.trim()
		.replace(/^\/+|\/+$/g, "");
	const lower = clean.toLowerCase();
	const base = clean.split("/").pop() ?? clean;

	const mk = (opts: Omit<PaletteItem, "id">): PaletteItem => ({
		id: `${opts.kind}:${opts.repo ?? ""}`,
		...opts,
	});

	if (
		lower.includes("endhost") ||
		lower.includes("linux") ||
		lower.includes("ubuntu") ||
		lower.includes("alpine")
	) {
		return mk({
			label: `Host · ${base}`,
			category: "Hosts",
			kind: "linux",
			repo: clean,
			vendor: "Linux",
			model: base,
			role: "host",
		});
	}

	if (base === "ceos" || lower.endsWith("/ceos") || lower.includes("/ceos:")) {
		return mk({
			label: "Switch · Arista cEOS",
			category: "Switches",
			kind: "ceos",
			repo: clean,
			vendor: "Arista",
			model: "cEOS",
			role: "switch",
		});
	}

	if (lower.includes("vrnetlab/cisco_iol")) {
		return mk({
			label: "Router · Cisco IOL (IOS)",
			category: "Routers",
			kind: "cisco_iol",
			repo: clean,
			vendor: "Cisco",
			model: "IOL",
			role: "router",
		});
	}
	if (lower.includes("vrnetlab/vr-n9kv") || lower.includes("vrnetlab/nxos")) {
		return mk({
			label: "Switch · Cisco NX-OSv (N9Kv)",
			category: "Switches",
			kind: "vr-n9kv",
			repo: clean,
			vendor: "Cisco",
			model: "NX-OSv9k",
			role: "switch",
		});
	}
	if (lower.includes("vrnetlab/vr-vmx") || lower.includes("/vr-vmx")) {
		return mk({
			label: "Router · Juniper vMX",
			category: "Routers",
			kind: "vr-vmx",
			repo: clean,
			vendor: "Juniper",
			model: "vMX",
			role: "router",
		});
	}
	if (lower.includes("vrnetlab/juniper_vjunos-router")) {
		return mk({
			label: "Router · Juniper vJunos Router",
			category: "Routers",
			kind: "juniper_vjunos-router",
			repo: clean,
			vendor: "Juniper",
			model: "vJunos-router",
			role: "router",
		});
	}
	if (lower.includes("vrnetlab/juniper_vjunos-switch")) {
		return mk({
			label: "Switch · Juniper vJunos Switch",
			category: "Switches",
			kind: "juniper_vjunos-switch",
			repo: clean,
			vendor: "Juniper",
			model: "vJunos-switch",
			role: "switch",
		});
	}
	if (
		lower.includes("ghcr.io/forwardnetworks/kubevirt/juniper_vsrx") ||
		lower.includes("vsrx") ||
		lower.includes("/srx")
	) {
		return mk({
			label: "Firewall · Juniper SRX",
			category: "Firewalls",
			kind: "vsrx",
			repo: clean,
			vendor: "Juniper",
			model: "SRX",
			role: "firewall",
		});
	}
	if (
		lower.includes("ghcr.io/forwardnetworks/kubevirt/fortios") ||
		lower.includes("fortios")
	) {
		return mk({
			label: "Firewall · Fortinet FortiOS",
			category: "Firewalls",
			kind: "fortios",
			repo: clean,
			vendor: "Fortinet",
			model: "FortiOS",
			role: "firewall",
		});
	}
	if (lower.includes("vrnetlab/vr-ftosv") || lower.includes("os10")) {
		return mk({
			label: "Switch · Dell OS10",
			category: "Switches",
			kind: "vr-ftosv",
			repo: clean,
			vendor: "Dell",
			model: "OS10",
			role: "switch",
		});
	}
	if (
		lower.includes("vrnetlab/") &&
		(lower.includes("asa") ||
			lower.includes("pan") ||
			lower.includes("palo") ||
			lower.includes("checkpoint"))
	) {
		return mk({
			label: `Firewall · ${base}`,
			category: "Firewalls",
			kind: base,
			repo: clean,
			role: "firewall",
		});
	}

	return mk({
		label: `Node · ${base}`,
		category: "Other",
		kind: base,
		repo: clean,
		role: "other",
	});
}

export function PaletteDraggableItem(props: { item: PaletteItem }) {
	const p = props.item;
	const Icon =
		p.role === "firewall" ? Shield : p.role === "host" ? Server : Waypoints;
	const heading = p.vendor
		? `${p.vendor}${p.model ? ` · ${p.model}` : ""}`
		: p.label;
	const role =
		p.role === "router"
			? "Router"
			: p.role === "switch"
				? "Switch"
				: p.role === "firewall"
					? "Firewall"
					: p.role === "host"
						? "Host"
						: "Node";
	return (
		<div
			className="cursor-grab select-none rounded-lg border bg-background px-3 py-2 text-sm hover:bg-accent"
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData(paletteMimeType, JSON.stringify(p));
				e.dataTransfer.effectAllowed = "copy";
			}}
			title={p.repo ? `${p.label}\n${p.repo}` : p.label}
		>
			<div className="flex items-start gap-2">
				<Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
				<div className="min-w-0">
					<div className="truncate flex items-center gap-2">
						<span className="truncate">{heading}</span>
						<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
							{role}
						</span>
					</div>
					<div className="truncate text-[11px] text-muted-foreground font-mono">
						{p.repo ?? p.kind}
					</div>
				</div>
			</div>
		</div>
	);
}

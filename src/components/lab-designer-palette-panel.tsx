import { PaletteDraggableItem } from "@/components/lab-designer-palette";
import type { LabDesignerWorkspaceProps } from "@/components/lab-designer-workspace-types";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Props = Pick<
	LabDesignerWorkspaceProps,
	| "paletteSearch"
	| "onPaletteSearchChange"
	| "paletteVendor"
	| "onPaletteVendorChange"
	| "paletteRole"
	| "onPaletteRoleChange"
	| "paletteVendors"
	| "paletteItems"
	| "registryReposLoading"
	| "registryReposError"
	| "registryError"
	| "paletteIsFilteredEmpty"
>;

export function LabDesignerPalettePanel(props: Props) {
	return (
		<div className="w-[180px] border-r bg-background p-3">
			<div className="text-xs font-semibold text-muted-foreground">Palette</div>
			<div className="mt-2">
				<Input
					value={props.paletteSearch}
					onChange={(e) => props.onPaletteSearchChange(e.target.value)}
					placeholder="Search…"
					className="h-8"
				/>
			</div>
			<div className="mt-2 grid gap-2">
				<Select
					value={props.paletteVendor}
					onValueChange={props.onPaletteVendorChange}
				>
					<SelectTrigger className="h-8">
						<SelectValue placeholder="Vendor" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All vendors</SelectItem>
						{props.paletteVendors.map((vendor) => (
							<SelectItem key={vendor} value={vendor}>
								{vendor}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={props.paletteRole}
					onValueChange={props.onPaletteRoleChange}
				>
					<SelectTrigger className="h-8">
						<SelectValue placeholder="Role" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All roles</SelectItem>
						<SelectItem value="router">Routers</SelectItem>
						<SelectItem value="switch">Switches</SelectItem>
						<SelectItem value="firewall">Firewalls</SelectItem>
						<SelectItem value="host">Hosts</SelectItem>
						<SelectItem value="other">Other</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="mt-3 space-y-2">
				{props.registryReposLoading ? (
					<div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
						Loading images…
					</div>
				) : props.paletteItems.length === 0 ? (
					<div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
						{props.registryReposError ? (
							<div className="space-y-1">
								<div className="font-medium text-foreground">
									Registry not available
								</div>
								<div>{props.registryError}</div>
								<div>
									Set SKYFORGE_REGISTRY_URL (e.g. https://ghcr.io) and optional
									credentials.
								</div>
							</div>
						) : props.paletteIsFilteredEmpty ? (
							<div className="space-y-1">
								<div className="font-medium text-foreground">No matches</div>
								<div>Try clearing filters or search terms.</div>
							</div>
						) : (
							<div className="space-y-1">
								<div className="font-medium text-foreground">No images yet</div>
								<div>
									Add container images to your registry (e.g. GHCR) or adjust
									registry repo prefixes.
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="space-y-3">
						{(["Hosts", "Routers", "Switches", "Firewalls", "Other"] as const)
							.map((category) => ({
								category,
								items: props.paletteItems.filter(
									(item) => item.category === category,
								),
							}))
							.filter((group) => group.items.length > 0)
							.map((group) => (
								<div key={group.category} className="space-y-1">
									<div className="text-[11px] font-semibold text-muted-foreground">
										{group.category}
									</div>
									<div className="space-y-2">
										{group.items.slice(0, 60).map((item) => (
											<PaletteDraggableItem key={item.id} item={item} />
										))}
									</div>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
}

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RegistryImagePicker } from "@/components/registry-image-picker";
import {
	formatEnv,
	formatInterfaces,
	LabDesignerNodeEditorProps,
	parseEnv,
	parseInterfaces,
	updateSelectedNode,
} from "@/components/lab-designer-editor-utils";

function NodeEditorHeader({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div>
				<div className="text-sm font-semibold text-foreground">
					{String(page.selectedNode?.data?.label ?? page.selectedNode?.id)}
				</div>
				<div className="text-xs text-muted-foreground">Graph node editor</div>
			</div>
			{page.selectedNode?.data?.status ? (
				<Badge variant="outline">{page.selectedNode.data.status}</Badge>
			) : null}
		</div>
	);
}

function NodeIdentityField({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="space-y-1">
			<Label>Name</Label>
			<Input
				value={String(page.selectedNode?.data?.label ?? page.selectedNode?.id)}
				onChange={(e) =>
					updateSelectedNode(page, (data) => ({
						...data,
						label: e.target.value,
					}))
				}
			/>
		</div>
	);
}

function NodeKindAndMgmtFields({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<div className="space-y-1">
				<Label>Kind</Label>
				<Input
					value={String(page.selectedNode?.data?.kind ?? "")}
					onChange={(e) =>
						updateSelectedNode(page, (data) => ({
							...data,
							kind: e.target.value,
						}))
					}
					placeholder="ceos, linux, ..."
				/>
			</div>
			<div className="space-y-1">
				<Label>Mgmt IPv4</Label>
				<Input
					value={String(page.selectedNode?.data?.mgmtIpv4 ?? "")}
					onChange={(e) =>
						updateSelectedNode(page, (data) => ({
							...data,
							mgmtIpv4: e.target.value || undefined,
						}))
					}
					placeholder="172.20.20.10"
				/>
			</div>
		</div>
	);
}

function NodeImageField({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="space-y-1">
			<Label>Image</Label>
			<RegistryImagePicker
				value={String(page.selectedNode?.data?.image ?? "")}
				onChange={(value) =>
					updateSelectedNode(page, (data) => ({
						...data,
						image: value,
					}))
				}
			/>
		</div>
	);
}

function NodeStartupField({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="space-y-1">
			<Label>Startup config</Label>
			<Input
				value={String(page.selectedNode?.data?.startupConfig ?? "")}
				onChange={(e) =>
					updateSelectedNode(page, (data) => ({
						...data,
						startupConfig: e.target.value || undefined,
					}))
				}
				placeholder="configs/r1.cfg"
			/>
		</div>
	);
}

function NodeInterfaceAndEnvironmentFields({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="grid gap-3">
			<div className="space-y-1">
				<Label>Interfaces</Label>
				<Textarea
					value={formatInterfaces(page.selectedNode?.data?.interfaces)}
					onChange={(e) =>
						updateSelectedNode(page, (data) => ({
							...data,
							interfaces: parseInterfaces(e.target.value),
						}))
					}
					className="min-h-[120px] font-mono text-xs"
					placeholder={"eth1\neth2\neth3"}
				/>
			</div>
			<div className="space-y-1">
				<Label>Environment</Label>
				<Textarea
					value={formatEnv(page.selectedNode?.data?.env)}
					onChange={(e) =>
						updateSelectedNode(page, (data) => ({
							...data,
							env: parseEnv(e.target.value),
						}))
					}
					className="min-h-[120px] font-mono text-xs"
					placeholder={"USERNAME=admin\nPASSWORD=admin"}
				/>
			</div>
		</div>
	);
}

function NodeNotesField({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="space-y-1">
			<Label>Notes</Label>
			<Textarea
				value={String(page.selectedNode?.data?.notes ?? "")}
				onChange={(e) =>
					updateSelectedNode(page, (data) => ({
						...data,
						notes: e.target.value || undefined,
					}))
				}
				className="min-h-[100px] text-xs"
				placeholder="Operator notes, bootstrap assumptions, quirks..."
			/>
		</div>
	);
}

export function LabDesignerNodeEditorContent({ page }: LabDesignerNodeEditorProps) {
	return (
		<>
			<NodeEditorHeader page={page} />
			<NodeIdentityField page={page} />
			<NodeKindAndMgmtFields page={page} />
			<NodeImageField page={page} />
			<NodeStartupField page={page} />
			<NodeInterfaceAndEnvironmentFields page={page} />
			<NodeNotesField page={page} />
		</>
	);
}

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link2 } from "lucide-react";
import {
	LabDesignerLinkEditorProps,
	updateSelectedEdge,
} from "@/components/lab-designer-editor-utils";

function LinkEditorHeader({ selectedEdge }: { selectedEdge: LabDesignerLinkEditorProps["selectedEdge"] }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div>
				<div className="text-sm font-semibold text-foreground">
					{selectedEdge.data?.label || selectedEdge.label || selectedEdge.id}
				</div>
				<div className="text-xs text-muted-foreground">
					{selectedEdge.source} ↔ {selectedEdge.target}
				</div>
			</div>
			<Badge variant="outline">
				<Link2 className="mr-1 h-3.5 w-3.5" />
				Link
			</Badge>
		</div>
	);
}

function LinkInterfaceFields({ page, selectedEdge }: LabDesignerLinkEditorProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<div className="space-y-1">
				<Label>Source interface</Label>
				<Input
					value={String(selectedEdge.data?.sourceIf ?? "")}
					onChange={(e) =>
						updateSelectedEdge(page, selectedEdge.id, (current) => ({
							...current,
							data: {
								...current.data,
								sourceIf: e.target.value || undefined,
							},
						}))
					}
				/>
			</div>
			<div className="space-y-1">
				<Label>Target interface</Label>
				<Input
					value={String(selectedEdge.data?.targetIf ?? "")}
					onChange={(e) =>
						updateSelectedEdge(page, selectedEdge.id, (current) => ({
							...current,
							data: {
								...current.data,
								targetIf: e.target.value || undefined,
							},
						}))
					}
				/>
			</div>
		</div>
	);
}

function LinkLabelAndMtuFields({ page, selectedEdge }: LabDesignerLinkEditorProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<div className="space-y-1">
				<Label>Label</Label>
				<Input
					value={String(selectedEdge.data?.label ?? "")}
					onChange={(e) =>
						updateSelectedEdge(page, selectedEdge.id, (current) => ({
							...current,
							label: e.target.value,
							data: {
								...current.data,
								label: e.target.value || undefined,
							},
						}))
					}
					placeholder="leaf1:eth1 ↔ spine1:eth1"
				/>
			</div>
			<div className="space-y-1">
				<Label>MTU</Label>
				<Input
					type="number"
					value={String(selectedEdge.data?.mtu ?? "")}
					onChange={(e) =>
						updateSelectedEdge(page, selectedEdge.id, (current) => ({
							...current,
							data: {
								...current.data,
								mtu: e.target.value ? Number(e.target.value) : undefined,
							},
						}))
					}
				/>
			</div>
		</div>
	);
}

function LinkNotesField({ page, selectedEdge }: LabDesignerLinkEditorProps) {
	return (
		<div className="space-y-1">
			<Label>Notes</Label>
			<Textarea
				value={String(selectedEdge.data?.notes ?? "")}
				onChange={(e) =>
					updateSelectedEdge(page, selectedEdge.id, (current) => ({
						...current,
						data: {
							...current.data,
							notes: e.target.value || undefined,
						},
					}))
				}
				className="min-h-[120px] text-xs"
				placeholder="Optional link metadata or operator notes"
			/>
		</div>
	);
}

export function LabDesignerLinkEditorContent({
	page,
	selectedEdge,
}: LabDesignerLinkEditorProps) {
	return (
		<>
			<LinkEditorHeader selectedEdge={selectedEdge} />
			<LinkInterfaceFields page={page} selectedEdge={selectedEdge} />
			<LinkLabelAndMtuFields page={page} selectedEdge={selectedEdge} />
			<LinkNotesField page={page} selectedEdge={selectedEdge} />
		</>
	);
}

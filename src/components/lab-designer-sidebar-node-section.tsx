import type { DesignNode } from "@/components/lab-designer-types";
import { RegistryImagePicker } from "@/components/registry-image-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LabDesignerSidebarNodeSectionProps = {
	selectedNode: DesignNode | null;
	onSelectedNodeLabelChange: (value: string) => void;
	onSelectedNodeKindChange: (value: string) => void;
	onSelectedNodeImageChange: (value: string) => void;
};

export function LabDesignerSidebarNodeSection(
	props: LabDesignerSidebarNodeSectionProps,
) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Node</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!props.selectedNode ? (
					<div className="text-sm text-muted-foreground">
						Click a node to edit.
					</div>
				) : (
					<>
						<div className="space-y-1">
							<Label>Name</Label>
							<Input
								value={String(
									props.selectedNode.data?.label ?? props.selectedNode.id,
								)}
								onChange={(e) =>
									props.onSelectedNodeLabelChange(e.target.value)
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Kind</Label>
							<Input
								value={String(props.selectedNode.data?.kind ?? "")}
								onChange={(e) => props.onSelectedNodeKindChange(e.target.value)}
								placeholder="linux, ceos, ..."
							/>
						</div>
						<RegistryImagePicker
							value={String(props.selectedNode.data?.image ?? "")}
							onChange={props.onSelectedNodeImageChange}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}

import { RegistryImagePicker } from "@/components/registry-image-picker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	qsName: string;
	onQsNameChange: (value: string) => void;
	qsSpines: number;
	onQsSpinesChange: (value: number) => void;
	qsLeaves: number;
	onQsLeavesChange: (value: number) => void;
	qsHostsPerLeaf: number;
	onQsHostsPerLeafChange: (value: number) => void;
	qsSwitchKind: string;
	onQsSwitchKindChange: (value: string) => void;
	qsSwitchImage: string;
	onQsSwitchImageChange: (value: string) => void;
	qsHostKind: string;
	onQsHostKindChange: (value: string) => void;
	qsHostImage: string;
	onQsHostImageChange: (value: string) => void;
	onGenerate: () => void;
};

export function LabDesignerQuickstartDialog(props: Props) {
	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent className="border-border/70 bg-card/95 sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Quickstart: Generate CLOS</DialogTitle>
					<DialogDescription>
						Generate a simple leaf/spine fabric (inspired by `clab generate`).
						This populates the designer canvas; you can edit nodes and YAML
						afterwards.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-3">
						<Label>Lab name</Label>
						<Input
							value={props.qsName}
							onChange={(e) => props.onQsNameChange(e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-muted/20 p-3">
						<div className="space-y-1">
							<Label>Spines</Label>
							<Input
								type="number"
								min={1}
								max={16}
								value={props.qsSpines}
								onChange={(e) =>
									props.onQsSpinesChange(Number(e.target.value || 0))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Leaves</Label>
							<Input
								type="number"
								min={1}
								max={64}
								value={props.qsLeaves}
								onChange={(e) =>
									props.onQsLeavesChange(Number(e.target.value || 0))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Hosts/leaf</Label>
							<Input
								type="number"
								min={0}
								max={16}
								value={props.qsHostsPerLeaf}
								onChange={(e) =>
									props.onQsHostsPerLeafChange(Number(e.target.value || 0))
								}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3">
							<div className="space-y-1">
								<Label>Switch kind</Label>
								<Input
									value={props.qsSwitchKind}
									onChange={(e) => props.onQsSwitchKindChange(e.target.value)}
									placeholder="ceos"
								/>
							</div>
							<RegistryImagePicker
								value={props.qsSwitchImage}
								onChange={props.onQsSwitchImageChange}
							/>
						</div>
						<div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3">
							<div className="space-y-1">
								<Label>Host kind</Label>
								<Input
									value={props.qsHostKind}
									onChange={(e) => props.onQsHostKindChange(e.target.value)}
									placeholder="linux"
								/>
							</div>
							<RegistryImagePicker
								value={props.qsHostImage}
								onChange={props.onQsHostImageChange}
							/>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => props.onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={props.onGenerate}>Generate</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

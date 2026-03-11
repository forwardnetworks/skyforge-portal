import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";

type LabDesignerSidebarYamlSectionProps = {
	yamlMode: "generated" | "custom";
	onYamlModeChange: (value: "generated" | "custom") => void;
	yaml: string;
	effectiveYaml: string;
	customYaml: string;
	onCustomYamlChange: (value: string) => void;
	otherWarnings: string[];
	showWarnings: boolean;
	missingImageWarnings: string[];
	onCopyYaml: () => void;
};

export function LabDesignerSidebarYamlSection(
	props: LabDesignerSidebarYamlSectionProps,
) {
	const hasWarnings =
		props.otherWarnings.length > 0 ||
		(props.showWarnings && props.missingImageWarnings.length > 0);

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-3">
					<CardTitle>YAML</CardTitle>
					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline" onClick={props.onCopyYaml}>
							<Copy className="mr-2 h-4 w-4" />
							Copy
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant={props.yamlMode === "generated" ? "default" : "outline"}
						onClick={() => props.onYamlModeChange("generated")}
					>
						Generated
					</Button>
					<Button
						size="sm"
						variant={props.yamlMode === "custom" ? "default" : "outline"}
						onClick={() => props.onYamlModeChange("custom")}
					>
						Custom
					</Button>
				</div>
				{hasWarnings ? (
					<div className="rounded-md border bg-amber-500/10 text-amber-900 dark:text-amber-200 px-3 py-2 text-xs">
						{props.otherWarnings.slice(0, 6).map((warning) => (
							<div key={warning}>{warning}</div>
						))}
						{props.showWarnings
							? props.missingImageWarnings
									.slice(0, 6)
									.map((warning) => <div key={warning}>{warning}</div>)
							: null}
					</div>
				) : null}
				<Textarea
					value={props.yamlMode === "custom" ? props.customYaml : props.yaml}
					onChange={(e) => props.onCustomYamlChange(e.target.value)}
					readOnly={props.yamlMode !== "custom"}
					className="font-mono text-xs h-[320px]"
				/>
			</CardContent>
		</Card>
	);
}

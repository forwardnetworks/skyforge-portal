import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	path: string;
	yaml: string;
	isLoading: boolean;
	isError: boolean;
};

export function TemplatePreviewDialog({
	open,
	onOpenChange,
	path,
	yaml,
	isLoading,
	isError,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle>Template</DialogTitle>
					<DialogDescription className="font-mono text-xs truncate">
						{path}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					{isError && (
						<div className="text-sm text-destructive">
							Failed to load template.
						</div>
					)}
					<Textarea
						readOnly
						value={yaml}
						className="h-[60vh] font-mono text-xs"
						placeholder={isLoading ? "Loading…" : "No template loaded."}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

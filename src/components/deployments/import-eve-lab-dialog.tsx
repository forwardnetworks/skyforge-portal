import { Loader2 } from "lucide-react";
import { hostLabelFromURL } from "../../hooks/use-create-deployment-page";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { FormDescription, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

type EveServerOption = {
	id?: string;
	apiUrl?: string;
	name: string;
};

type SelectOption = {
	value: string;
	label: string;
};

type PendingMutation = {
	isPending: boolean;
	mutate: () => void;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	importServer: string;
	setImportServer: (value: string) => void;
	importLabPath: string;
	setImportLabPath: (value: string) => void;
	importDeploymentName: string;
	setImportDeploymentName: (value: string) => void;
	importCreateContainerlab: boolean;
	setImportCreateContainerlab: (value: boolean) => void;
	importContainerlabServer: string;
	setImportContainerlabServer: (value: string) => void;
	eveOptions: EveServerOption[];
	eveLabsLoading: boolean;
	eveLabsError: boolean;
	eveLabOptions: SelectOption[];
	byosContainerlabServerRefs: SelectOption[];
	importEveLab: PendingMutation;
	convertEveLab: PendingMutation;
};

export function ImportEveLabDialog({
	open,
	onOpenChange,
	importServer,
	setImportServer,
	importLabPath,
	setImportLabPath,
	importDeploymentName,
	setImportDeploymentName,
	importCreateContainerlab,
	setImportCreateContainerlab,
	importContainerlabServer,
	setImportContainerlabServer,
	eveOptions,
	eveLabsLoading,
	eveLabsError,
	eveLabOptions,
	byosContainerlabServerRefs,
	importEveLab,
	convertEveLab,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Import EVE-NG lab</DialogTitle>
					<DialogDescription>
						Pull an existing EVE-NG lab into Skyforge or convert it into a
						Containerlab template.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid gap-2">
						<FormLabel>EVE-NG server</FormLabel>
						<Select value={importServer} onValueChange={setImportServer}>
							<SelectTrigger>
								<SelectValue placeholder="Select EVE-NG server" />
							</SelectTrigger>
							<SelectContent>
								{eveOptions.map((s) => (
									<SelectItem key={s.id} value={`user:${s.id}`}>
										{hostLabelFromURL(s.apiUrl ?? "") || s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormDescription>
							Configure EVE-NG servers in Settings if none appear.
						</FormDescription>
					</div>

					<div className="grid gap-2">
						<FormLabel>EVE-NG lab</FormLabel>
						<Select value={importLabPath} onValueChange={setImportLabPath}>
							<SelectTrigger>
								<SelectValue placeholder="Select lab" />
							</SelectTrigger>
							<SelectContent>
								{eveLabsLoading && (
									<div className="px-3 py-2 text-xs text-muted-foreground">
										Loading labs…
									</div>
								)}
								{!eveLabsLoading && eveLabOptions.length === 0 && (
									<div className="px-3 py-2 text-xs text-muted-foreground">
										No labs found.
									</div>
								)}
								{eveLabOptions.map((lab) => (
									<SelectItem key={lab.value} value={lab.value}>
										{lab.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{eveLabsError && (
							<div className="text-xs text-destructive">
								Failed to load labs.
							</div>
						)}
					</div>

					<div className="grid gap-2">
						<FormLabel>Deployment name</FormLabel>
						<Input
							value={importDeploymentName}
							onChange={(e) => setImportDeploymentName(e.target.value)}
							placeholder="Optional override"
						/>
						<FormDescription>
							Defaults to the EVE-NG lab name if left empty.
						</FormDescription>
					</div>

					<div className="flex items-start justify-between gap-3 rounded-md border p-3">
						<div className="space-y-1">
							<FormLabel className="text-sm">
								Create Containerlab deployment
							</FormLabel>
							<FormDescription>
								Generate a Containerlab template and optionally create a
								deployment.
							</FormDescription>
						</div>
						<Switch
							checked={importCreateContainerlab}
							onCheckedChange={setImportCreateContainerlab}
						/>
					</div>

					{importCreateContainerlab && (
						<div className="grid gap-2">
							<FormLabel>Containerlab server</FormLabel>
							<Select
								value={importContainerlabServer}
								onValueChange={setImportContainerlabServer}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Containerlab server" />
								</SelectTrigger>
								<SelectContent>
									{byosContainerlabServerRefs.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								Required to create a Containerlab deployment.
							</FormDescription>
						</div>
					)}
				</div>

				<div className="flex flex-wrap justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => importEveLab.mutate()}
						disabled={importEveLab.isPending || convertEveLab.isPending}
					>
						{importEveLab.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Import EVE-NG
					</Button>
					<Button
						type="button"
						onClick={() => convertEveLab.mutate()}
						disabled={importEveLab.isPending || convertEveLab.isPending}
					>
						{convertEveLab.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Convert to Containerlab
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

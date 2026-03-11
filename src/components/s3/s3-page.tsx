import { S3ObjectTable } from "@/components/s3/s3-object-table";
import type { S3ObjectRow, S3UserScopeOption } from "@/components/s3/s3-types";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderPlus, Inbox, Upload } from "lucide-react";

type S3PageProps = {
	userScopeOptions: S3UserScopeOption[];
	selectedUserScopeId: string;
	onSelectedUserScopeIdChange: (userScopeId: string) => void;
	prefix: string;
	onPrefixChange: (prefix: string) => void;
	userScopesLoading: boolean;
	userScopesError: boolean;
	artifactsLoading: boolean;
	artifactsError: boolean;
	objects: S3ObjectRow[];
	onRefresh: () => Promise<unknown> | unknown;
	onCreateFolder: () => Promise<unknown> | unknown;
	onUpload: () => Promise<unknown> | unknown;
	onObjectsChanged: () => Promise<unknown> | unknown;
};

export function S3Page(props: S3PageProps) {
	const {
		userScopeOptions,
		selectedUserScopeId,
		onSelectedUserScopeIdChange,
		prefix,
		onPrefixChange,
		userScopesLoading,
		userScopesError,
		artifactsLoading,
		artifactsError,
		objects,
		onRefresh,
		onCreateFolder,
		onUpload,
		onObjectsChanged,
	} = props;

	const toolbar = (
		<div className="p-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div className="flex items-center gap-3">
				<div className="text-sm font-medium">User</div>
				<Select
					value={selectedUserScopeId}
					onValueChange={onSelectedUserScopeIdChange}
					disabled={userScopeOptions.length === 0}
				>
					<SelectTrigger className="w-[280px]">
						<SelectValue placeholder="Select user" />
					</SelectTrigger>
					<SelectContent>
						{userScopeOptions.map((scope) => (
							<SelectItem key={scope.id} value={scope.id}>
								{scope.name} ({scope.slug})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Input
					placeholder="Prefix (e.g. topology/)"
					value={prefix}
					onChange={(event) => onPrefixChange(event.target.value)}
					className="w-[260px]"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onRefresh()}
					disabled={!selectedUserScopeId}
				>
					Refresh
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onCreateFolder()}
					disabled={!selectedUserScopeId}
				>
					<FolderPlus className="mr-2 h-3 w-3" />
					Folder
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onUpload()}
					disabled={!selectedUserScopeId}
				>
					<Upload className="mr-2 h-3 w-3" />
					Upload
				</Button>
			</div>
		</div>
	);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>S3</CardTitle>
					<CardDescription>
						User-scope artifacts and generated files (backed by the platform
						object store).
					</CardDescription>
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="p-0">
					{userScopesLoading || artifactsLoading ? (
						<div className="p-6 space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (
						<div>
							{toolbar}
							{userScopesError || artifactsError ? (
								<div className="p-8 text-center text-destructive">
									Failed to list objects.
								</div>
							) : objects.length === 0 ? (
								<div className="p-6">
									<EmptyState
										icon={Inbox}
										title="No objects found"
										description="No artifacts found for this user."
									/>
								</div>
							) : (
								<S3ObjectTable
									rows={objects}
									selectedUserScopeId={selectedUserScopeId}
									onObjectsChanged={onObjectsChanged}
								/>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

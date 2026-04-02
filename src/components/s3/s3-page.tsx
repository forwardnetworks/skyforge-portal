import { S3ObjectTable } from "@/components/s3/s3-object-table";
import { buildBrowserRows, splitSegments } from "@/components/s3/s3-browser-utils";
import type {
	BrowserRow,
	BrowserSourceMode,
	PlatformBucketObjectRow,
	PlatformBucketOption,
	S3ObjectRow,
	S3UserScopeOption,
} from "@/components/s3/s3-types";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { formatBytes } from "@/components/topology-viewer-utils";
import type { SkyforgeUserScope } from "@/lib/api-client";
import { FolderPlus, HardDrive, Inbox, RefreshCw, Upload } from "lucide-react";
import { useMemo } from "react";

type S3PageProps = {
	sourceMode: BrowserSourceMode;
	onSourceModeChange: (mode: BrowserSourceMode) => void;
	userScopeOptions: S3UserScopeOption[];
	selectedUserScopeId: string;
	selectedUserScope: SkyforgeUserScope | null;
	onSelectedUserScopeIdChange: (userScopeId: string) => void;
	platformBucketOptions: PlatformBucketOption[];
	selectedBucket: string;
	selectedBucketMeta: PlatformBucketOption | null;
	onSelectedBucketChange: (bucket: string) => void;
	prefix: string;
	onPrefixChange: (prefix: string) => void;
	userScopesLoading: boolean;
	userScopesError: boolean;
	platformBucketsLoading: boolean;
	platformBucketsError: boolean;
	artifactsLoading: boolean;
	artifactsError: boolean;
	platformObjectsLoading: boolean;
	platformObjectsError: boolean;
	userObjects: S3ObjectRow[];
	platformObjects: PlatformBucketObjectRow[];
	onRefresh: () => Promise<unknown> | unknown;
	onCreateFolder: () => Promise<unknown> | unknown;
	onUpload: () => Promise<unknown> | unknown;
	onObjectsChanged: () => Promise<unknown> | unknown;
	onPreviewPlatformObject: (
		bucket: string,
		key: string,
		maxBytes?: string,
	) => Promise<import("@/components/s3/s3-types").PlatformBucketPreview>;
};

function currentSourceSummary(props: {
	sourceMode: BrowserSourceMode;
	selectedUserScope: SkyforgeUserScope | null;
	selectedBucketMeta: PlatformBucketOption | null;
	rows: BrowserRow[];
	prefix: string;
}) {
	const { sourceMode, selectedUserScope, selectedBucketMeta, rows, prefix } = props;
	const objectCount = rows.filter((row) => !row.isDirectory).length;
	const folderCount = rows.filter((row) => row.isDirectory).length;
	const totalBytes = rows.reduce((sum, row) => sum + (row.isDirectory ? 0 : row.size), 0);
	if (sourceMode === "platform-bucket") {
		return {
			title: selectedBucketMeta?.label ?? "Platform bucket",
			description:
				selectedBucketMeta?.description ?? "Read-only platform storage browser.",
			context: selectedBucketMeta?.name ?? "",
			objectCount,
			folderCount,
			totalBytes,
			prefix,
		};
	}
	return {
		title: selectedUserScope?.name ?? "User scope",
		description: "Read/write artifacts and generated files in the selected user scope.",
		context: selectedUserScope?.slug ?? "",
		objectCount,
		folderCount,
		totalBytes,
		prefix,
	};
}

export function S3Page(props: S3PageProps) {
	const {
		sourceMode,
		onSourceModeChange,
		userScopeOptions,
		selectedUserScopeId,
		selectedUserScope,
		onSelectedUserScopeIdChange,
		platformBucketOptions,
		selectedBucket,
		selectedBucketMeta,
		onSelectedBucketChange,
		prefix,
		onPrefixChange,
		userScopesLoading,
		userScopesError,
		platformBucketsLoading,
		platformBucketsError,
		artifactsLoading,
		artifactsError,
		platformObjectsLoading,
		platformObjectsError,
		userObjects,
		platformObjects,
		onRefresh,
		onCreateFolder,
		onUpload,
		onObjectsChanged,
		onPreviewPlatformObject,
	} = props;

	const rows = useMemo(
		() => buildBrowserRows(sourceMode, prefix, userObjects, platformObjects),
		[sourceMode, prefix, userObjects, platformObjects],
	);
	const segments = useMemo(() => splitSegments(prefix), [prefix]);
	const loading =
		userScopesLoading ||
		(sourceMode === "platform-bucket" ? platformBucketsLoading || platformObjectsLoading : artifactsLoading);
	const hasError =
		userScopesError ||
		(sourceMode === "platform-bucket" ? platformBucketsError || platformObjectsError : artifactsError);
	const summary = currentSourceSummary({
		sourceMode,
		selectedUserScope,
		selectedBucketMeta,
		rows,
		prefix,
	});

	const emptyDescription =
		sourceMode === "platform-bucket"
			? "No objects found in this bucket path."
			: "No artifacts found in this user scope path.";

	const sourceSelector = (
		<div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
			<div className="text-sm font-medium">Source</div>
			<div className="flex flex-col gap-3 lg:flex-row">
				<Select value={sourceMode} onValueChange={(value) => onSourceModeChange(value as BrowserSourceMode)}>
					<SelectTrigger className="w-full lg:w-[220px]">
						<SelectValue placeholder="Choose browser source" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="user-scope">User artifacts</SelectItem>
						<SelectItem value="platform-bucket">Platform storage</SelectItem>
					</SelectContent>
				</Select>

				{sourceMode === "platform-bucket" ? (
					<Select
						value={selectedBucket}
						onValueChange={onSelectedBucketChange}
						disabled={platformBucketOptions.length === 0}
					>
						<SelectTrigger className="w-full lg:w-[320px]">
							<SelectValue placeholder="Select bucket" />
						</SelectTrigger>
						<SelectContent>
							{platformBucketOptions.map((bucket) => (
								<SelectItem key={bucket.name} value={bucket.name}>
									{bucket.label} ({bucket.name})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Select
						value={selectedUserScopeId}
						onValueChange={onSelectedUserScopeIdChange}
						disabled={userScopeOptions.length === 0}
					>
						<SelectTrigger className="w-full lg:w-[360px]">
							<SelectValue placeholder="Select user scope" />
						</SelectTrigger>
						<SelectContent>
							{userScopeOptions.map((scope) => (
								<SelectItem key={scope.id} value={scope.id}>
									{scope.name} ({scope.slug})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
		</div>
	);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<CardTitle>Artifacts</CardTitle>
							<CardDescription>
								Browse user-scope artifacts, generated files, and platform object-store buckets.
							</CardDescription>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">
								{sourceMode === "platform-bucket" ? "Read-only platform storage" : "Read/write user artifacts"}
							</Badge>
							{summary.context ? <Badge variant="outline">{summary.context}</Badge> : null}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{sourceSelector}
					<div className="grid gap-3 lg:grid-cols-4">
						<Card>
							<CardContent className="pt-6">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">Current source</div>
								<div className="mt-2 font-medium">{summary.title}</div>
								<div className="mt-1 text-sm text-muted-foreground">{summary.description}</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">Objects</div>
								<div className="mt-2 text-2xl font-semibold">{summary.objectCount}</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">Folders</div>
								<div className="mt-2 text-2xl font-semibold">{summary.folderCount}</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">Visible bytes</div>
								<div className="mt-2 text-2xl font-semibold">{formatBytes(summary.totalBytes)}</div>
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-6 space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (
						<div>
							<div className="flex flex-col gap-4 border-b p-4">
								<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
									<div className="min-w-0 flex-1">
										<Breadcrumb>
											<BreadcrumbList>
												<BreadcrumbItem>
													{segments.length === 0 ? (
														<BreadcrumbPage>root</BreadcrumbPage>
													) : (
														<BreadcrumbLink href="#" onClick={(event) => {
															event.preventDefault();
															onPrefixChange("");
														}}>
															root
														</BreadcrumbLink>
													)}
												</BreadcrumbItem>
												{segments.map((segment, index) => {
													const nextPrefix = `${segments.slice(0, index + 1).join("/")}/`;
													const isLast = index === segments.length - 1;
													return (
														<div key={nextPrefix} className="contents">
															<BreadcrumbSeparator />
															<BreadcrumbItem>
																{isLast ? (
																	<BreadcrumbPage>{segment}</BreadcrumbPage>
																) : (
																	<BreadcrumbLink href="#" onClick={(event) => {
																		event.preventDefault();
																		onPrefixChange(nextPrefix);
																	}}>
																		{segment}
																	</BreadcrumbLink>
																)}
															</BreadcrumbItem>
														</div>
													);
												})}
											</BreadcrumbList>
										</Breadcrumb>
										<div className="mt-2 text-sm text-muted-foreground">
											{summary.prefix ? `Path: ${summary.prefix}` : "Path: root"}
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button variant="outline" size="sm" onClick={() => void onRefresh()}>
											<RefreshCw className="mr-2 h-3 w-3" />
											Refresh
										</Button>
										{sourceMode === "user-scope" ? (
											<>
												<Button variant="outline" size="sm" onClick={() => void onCreateFolder()} disabled={!selectedUserScopeId}>
													<FolderPlus className="mr-2 h-3 w-3" />
													Folder
												</Button>
												<Button variant="outline" size="sm" onClick={() => void onUpload()} disabled={!selectedUserScopeId}>
													<Upload className="mr-2 h-3 w-3" />
													Upload
												</Button>
											</>
										) : null}
									</div>
								</div>
								<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
									<Input
										placeholder="Prefix (for example topology/runs/)"
										value={prefix}
										onChange={(event) => onPrefixChange(event.target.value)}
									/>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<HardDrive className="h-4 w-4" />
										{sourceMode === "platform-bucket" ? "Read-only" : "Managed in this scope"}
									</div>
									<div className="text-sm text-muted-foreground">
										{rows.length} visible entr{rows.length === 1 ? "y" : "ies"}
									</div>
								</div>
							</div>
							{hasError ? (
								<div className="p-8 text-center text-destructive">Failed to list objects.</div>
							) : rows.length === 0 ? (
								<div className="p-6">
									<EmptyState
										icon={Inbox}
										title="No objects found"
										description={emptyDescription}
										action={
											sourceMode === "user-scope"
												? { label: "Upload file", onClick: () => void onUpload() }
												: undefined
										}
									/>
								</div>
							) : (
								<S3ObjectTable
									rows={rows}
									selectedUserScopeId={selectedUserScopeId}
									selectedBucket={selectedBucket}
									onObjectsChanged={onObjectsChanged}
									onPreviewPlatformObject={onPreviewPlatformObject}
									onOpenPrefix={onPrefixChange}
								/>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}


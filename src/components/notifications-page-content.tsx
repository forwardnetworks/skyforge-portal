import type { NotificationsPageState } from "@/hooks/use-notifications-page";
import type { NotificationRecord } from "@/lib/api-client";
import { Bell, Check, Inbox, MoreHorizontal, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button, buttonVariants } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { DataTable, type DataTableColumn } from "./ui/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EmptyState } from "./ui/empty-state";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";

export function NotificationsPageContent(props: {
	page: NotificationsPageState;
}) {
	const { page } = props;

	const columns: Array<DataTableColumn<NotificationRecord>> = [
		{
			id: "select",
			header: (
				<Checkbox
					checked={
						page.list.length > 0 && page.selected.size === page.list.length
					}
					onCheckedChange={(checked) => page.handleSelectAll(Boolean(checked))}
					aria-label="Select all"
				/>
			),
			width: 54,
			headerClassName: "px-2 py-0",
			className: "px-2 py-0",
			cell: (notification) => {
				const id = String(notification.id);
				return (
					<Checkbox
						checked={page.selected.has(id)}
						onCheckedChange={(checked) =>
							page.handleSelectOne(id, checked as boolean)
						}
						aria-label={`Select notification ${id}`}
					/>
				);
			},
		},
		{
			id: "time",
			header: "Time",
			width: 190,
			cell: (notification) => (
				<span className="text-muted-foreground text-xs whitespace-nowrap">
					{notification.created_at ?? ""}
				</span>
			),
		},
		{
			id: "message",
			header: "Title & Message",
			cell: (notification) => (
				<div>
					<div className="font-medium text-sm">{notification.title ?? ""}</div>
					{notification.message ? (
						<div className="mt-1 text-xs text-muted-foreground line-clamp-2">
							{notification.message}
						</div>
					) : null}
				</div>
			),
		},
		{
			id: "category",
			header: "Category",
			width: 160,
			cell: (notification) => (
				<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
					{notification.category ?? "System"}
				</span>
			),
		},
		{
			id: "actions",
			header: "Actions",
			width: 120,
			align: "right",
			cell: (notification) => {
				const id = String(notification.id);
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{!notification.is_read ? (
								<DropdownMenuItem onClick={() => page.handleMarkRead(id)}>
									<Check className="mr-2 h-4 w-4" />
									<span>Mark as read</span>
								</DropdownMenuItem>
							) : null}
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => {
									page.setDeleteTarget(id);
									page.setDeleteDialogOpen(true);
								}}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								<span>Delete</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-full bg-primary/10">
								<Bell className="h-6 w-6 text-primary" />
							</div>
							<div>
								<CardTitle>Notifications</CardTitle>
								<CardDescription>
									Stay updated with platform events and system alerts.
								</CardDescription>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Switch
									id="show-read"
									checked={page.includeRead}
									onCheckedChange={page.setIncludeRead}
								/>
								<Label htmlFor="show-read" className="cursor-pointer">
									Show read
								</Label>
							</div>
							<Button
								variant="outline"
								size="sm"
								disabled={!page.username || page.unreadCount === 0}
								onClick={page.handleMarkAllRead}
							>
								Mark all read
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			{page.selected.size > 0 ? (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border bg-background/95 p-2 px-6 shadow-xl backdrop-blur animate-in slide-in-from-bottom-10 fade-in duration-300">
					<span className="text-sm font-medium">
						{page.selected.size} selected
					</span>
					<div className="h-4 w-px bg-border" />
					<Button size="sm" variant="ghost" onClick={page.handleBulkMarkRead}>
						<Check className="mr-2 h-4 w-4" />
						Mark read
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={page.handleBulkDelete}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => page.setSelected(new Set())}
					>
						Cancel
					</Button>
				</div>
			) : null}

			<Card>
				<CardContent className="p-0">
					{page.notifications.isLoading ? (
						<div className="p-6 space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : page.notifications.isError ? (
						<div className="p-8 text-center text-destructive">
							Failed to load notifications.
						</div>
					) : page.list.length === 0 ? (
						<EmptyState
							icon={Inbox}
							title="No notifications"
							description={
								page.includeRead
									? "You don't have any notifications at the moment."
									: "You've read all your notifications!"
							}
						/>
					) : (
						<DataTable
							columns={columns}
							rows={page.list}
							getRowId={(row) => String(row.id)}
							getRowClassName={(row) => {
								const id = String(row.id);
								const isSelected = page.selected.has(id);
								return [
									row.is_read ? "opacity-60 grayscale-[0.5]" : "",
									isSelected ? "bg-primary/10 hover:bg-primary/10" : "",
								]
									.filter(Boolean)
									.join(" ");
							}}
							getRowAriaSelected={(row) => page.selected.has(String(row.id))}
							maxHeightClassName="max-h-[65vh]"
							minWidthClassName="min-w-[900px]"
						/>
					)}
				</CardContent>
			</Card>

			<AlertDialog
				open={page.deleteDialogOpen}
				onOpenChange={page.setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete notification?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={page.handleDelete}
							className={buttonVariants({ variant: "destructive" })}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

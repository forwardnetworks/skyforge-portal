import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	deleteNotification,
	getSession,
	getUserNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "../lib/api-client";
import type { NotificationRecord } from "../lib/api-client";
import {
	type NotificationsSnapshot,
	useNotificationsEvents,
} from "../lib/notifications-events";
import { queryKeys } from "../lib/query-keys";

export function useNotificationsPage() {
	const [includeRead, setIncludeRead] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const limit = "50";

	const queryClient = useQueryClient();
	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const username = session.data?.username ?? "";

	useNotificationsEvents(!!username, includeRead, limit);

	const notifications = useQuery<NotificationsSnapshot>({
		queryKey: queryKeys.notifications(includeRead, limit),
		enabled: !!username,
		queryFn: async () => {
			const resp = await getUserNotifications(username, {
				include_read: includeRead ? "true" : "false",
				limit,
			});
			return { notifications: resp.notifications ?? [] };
		},
		staleTime: Number.POSITIVE_INFINITY,
		initialData: { notifications: [] },
	});

	const list = useMemo(
		() => notifications.data?.notifications ?? [],
		[notifications.data?.notifications],
	);
	const unreadCount = useMemo(
		() =>
			list.filter((notification: NotificationRecord) => !notification.is_read)
				.length,
		[list],
	);

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelected(new Set(list.map((notification) => String(notification.id))));
			return;
		}
		setSelected(new Set());
	};

	const handleSelectOne = (id: string, checked: boolean) => {
		const next = new Set(selected);
		if (checked) {
			next.add(id);
		} else {
			next.delete(id);
		}
		setSelected(next);
	};

	const refreshNotifications = async () => {
		await queryClient.invalidateQueries({
			queryKey: queryKeys.notifications(includeRead, limit),
		});
	};

	const handleBulkMarkRead = async () => {
		try {
			await Promise.all(
				Array.from(selected).map((id) => markNotificationAsRead(id)),
			);
			toast.success(`${selected.size} notifications marked as read`);
			setSelected(new Set());
			await refreshNotifications();
		} catch (error) {
			toast.error("Failed to mark selection as read", {
				description: (error as Error).message,
			});
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(
				Array.from(selected).map((id) => deleteNotification(id)),
			);
			toast.success(`${selected.size} notifications deleted`);
			setSelected(new Set());
			await refreshNotifications();
		} catch (error) {
			toast.error("Failed to delete selection", {
				description: (error as Error).message,
			});
		}
	};

	const handleMarkAllRead = async () => {
		try {
			await markAllNotificationsAsRead(username);
			toast.success("All notifications marked as read");
		} catch (error) {
			toast.error("Failed to mark notifications as read", {
				description: (error as Error).message,
			});
		}
	};

	const handleMarkRead = async (id: string) => {
		try {
			await markNotificationAsRead(id);
			toast.success("Notification marked as read");
		} catch (error) {
			toast.error("Failed to mark notification as read", {
				description: (error as Error).message,
			});
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteNotification(deleteTarget);
			toast.success("Notification deleted");
			setDeleteDialogOpen(false);
			setDeleteTarget(null);
		} catch (error) {
			toast.error("Failed to delete notification", {
				description: (error as Error).message,
			});
		}
	};

	return {
		includeRead,
		setIncludeRead,
		deleteTarget,
		setDeleteTarget,
		deleteDialogOpen,
		setDeleteDialogOpen,
		selected,
		setSelected,
		limit,
		session,
		username,
		notifications,
		list,
		unreadCount,
		handleSelectAll,
		handleSelectOne,
		handleBulkMarkRead,
		handleBulkDelete,
		handleMarkAllRead,
		handleMarkRead,
		handleDelete,
	};
}

export type NotificationsPageState = ReturnType<typeof useNotificationsPage>;

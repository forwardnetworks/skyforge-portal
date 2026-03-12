import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type GetUserNotificationsResponse =
	operations["GET:skyforge.GetUserNotifications"]["responses"][200]["content"]["application/json"];
export async function getUserNotifications(
	userID: string,
	params?: { include_read?: string; limit?: string },
): Promise<GetUserNotificationsResponse> {
	const qs = new URLSearchParams();
	if (params?.include_read) qs.set("include_read", params.include_read);
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<GetUserNotificationsResponse>(
		`/notifications/for-user/${encodeURIComponent(userID)}${suffix ? `?${suffix}` : ""}`,
	);
}

export type MarkAllNotificationsAsReadResponse =
	operations["PUT:skyforge.MarkAllNotificationsAsRead"]["responses"][200]["content"]["application/json"];
export async function markAllNotificationsAsRead(
	userID: string,
): Promise<MarkAllNotificationsAsReadResponse> {
	return apiFetch<MarkAllNotificationsAsReadResponse>(
		`/notifications/for-user/${encodeURIComponent(userID)}/read-all`,
		{ method: "PUT" },
	);
}

export type MarkNotificationAsReadResponse =
	operations["PUT:skyforge.MarkNotificationAsRead"]["responses"][200]["content"]["application/json"];
export async function markNotificationAsRead(
	id: string,
): Promise<MarkNotificationAsReadResponse> {
	return apiFetch<MarkNotificationAsReadResponse>(
		`/notifications/single/${encodeURIComponent(id)}/read`,
		{ method: "PUT" },
	);
}

export type DeleteNotificationResponse =
	operations["DELETE:skyforge.DeleteNotification"]["responses"][200]["content"]["application/json"];
export async function deleteNotification(
	id: string,
): Promise<DeleteNotificationResponse> {
	return apiFetch<DeleteNotificationResponse>(
		`/notifications/single/${encodeURIComponent(id)}`,
		{ method: "DELETE" },
	);
}

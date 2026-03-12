import {
	cancelCurrentPlatformReservation,
	createCurrentPlatformReservation,
	getCurrentPlatformAvailability,
	getCurrentPlatformReservationLifecycle,
	getCurrentPlatformReservations,
	normalizePlatformReservationRecord,
	preflightCurrentPlatformReservation,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function toLocalDateTimeValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toRFC3339OrNull(value: string): string | null {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toISOString();
}

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function usePlatformReservationsPage() {
	const queryClient = useQueryClient();
	const reservationsKey = queryKeys.userPlatformReservations();

	const availabilityKey = queryKeys.currentPlatformAvailability();

	const reservationsQ = useQuery({
		queryKey: reservationsKey,
		queryFn: getCurrentPlatformReservations,
		staleTime: 15_000,
	});

	const availabilityQ = useQuery({
		queryKey: availabilityKey,
		queryFn: getCurrentPlatformAvailability,
		staleTime: 15_000,
	});

	const reservations = useMemo(
		() =>
			(reservationsQ.data?.reservations ?? []).map(
				normalizePlatformReservationRecord,
			),
		[reservationsQ.data],
	);

	const [resourceClass, setResourceClass] = useState("standard");
	const [type, setType] = useState("scheduled-future");
	const [priorityTier, setPriorityTier] = useState("standard");
	const [templateRef, setTemplateRef] = useState("");
	const [notes, setNotes] = useState("");
	const [startAt, setStartAt] = useState(toLocalDateTimeValue(new Date()));
	const [endAt, setEndAt] = useState(
		toLocalDateTimeValue(addHours(new Date(), 1)),
	);
	const [selectedReservationID, setSelectedReservationID] = useState<string>("");
	const startAtRFC3339 = toRFC3339OrNull(startAt);
	const endAtRFC3339 = toRFC3339OrNull(endAt);
	const preflightEnabled = Boolean(startAtRFC3339 && endAtRFC3339);

	const preflightQ = useQuery({
		queryKey: queryKeys.currentPlatformReservationPreflight(
			resourceClass,
			type,
			priorityTier,
			templateRef.trim(),
			startAtRFC3339 ?? "",
			endAtRFC3339 ?? "",
		),
		queryFn: async () =>
			preflightCurrentPlatformReservation({
				resourceClass,
				type,
				priorityTier,
				templateRef: templateRef.trim(),
				startAt: startAtRFC3339 ?? "",
				endAt: endAtRFC3339 ?? "",
				notes: notes.trim(),
				metadata: {},
				userScopeId: "",
			}),
		enabled: preflightEnabled,
		staleTime: 10_000,
	});

	const reservationLifecycleQ = useQuery({
		queryKey: queryKeys.currentPlatformReservationLifecycle(selectedReservationID),
		queryFn: async () => getCurrentPlatformReservationLifecycle(selectedReservationID),
		enabled: selectedReservationID.trim().length > 0,
		staleTime: 10_000,
	});

	const createReservationMutation = useMutation({
		mutationFn: async () => {
			if (!startAtRFC3339 || !endAtRFC3339) {
				throw new Error("Valid start and end times are required");
			}
			return createCurrentPlatformReservation({
				resourceClass,
				type,
				priorityTier,
				templateRef: templateRef.trim(),
				startAt: startAtRFC3339,
				endAt: endAtRFC3339,
				notes: notes.trim(),
				metadata: {},
				userScopeId: "",
			});
		},
		onSuccess: async () => {
			toast.success("Reservation requested");
			await queryClient.invalidateQueries({ queryKey: reservationsKey });
			await queryClient.invalidateQueries({
				queryKey: queryKeys.currentPlatformReservationPreflight(
					resourceClass,
					type,
					priorityTier,
					templateRef.trim(),
					startAtRFC3339 ?? "",
					endAtRFC3339 ?? "",
				),
			});
			setSelectedReservationID("");
		},
		onError: (err) =>
			toast.error("Failed to create reservation", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const cancelReservationMutation = useMutation({
		mutationFn: async (id: string) => cancelCurrentPlatformReservation(id),
		onSuccess: async (_, id) => {
			toast.success("Reservation cancelled");
			await queryClient.invalidateQueries({ queryKey: reservationsKey });
			await queryClient.invalidateQueries({
				queryKey: queryKeys.currentPlatformReservationLifecycle(id),
			});
		},
		onError: (err) =>
			toast.error("Failed to cancel reservation", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return {
		reservationsQ,
		reservations,
		availabilityQ,
		preflightQ,
		preflightEnabled,
		selectedReservationID,
		setSelectedReservationID,
		reservationLifecycleQ,
		resourceClass,
		setResourceClass,
		type,
		setType,
		priorityTier,
		setPriorityTier,
		templateRef,
		setTemplateRef,
		notes,
		setNotes,
		startAt,
		setStartAt,
		endAt,
		setEndAt,
		createReservationMutation,
		cancelReservationMutation,
	};
}

export type PlatformReservationsPageState = ReturnType<
	typeof usePlatformReservationsPage
>;

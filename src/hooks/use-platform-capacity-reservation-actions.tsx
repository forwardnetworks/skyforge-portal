import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	createAdminPlatformReservation,
	updateAdminPlatformReservationStatus,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	addHours,
	toLocalDateTimeValue,
	toRFC3339,
} from "./platform-capacity-page-normalize";

export function usePlatformCapacityReservationActions() {
	const queryClient = useQueryClient();
	const [reservedBlockResourceClass, setReservedBlockResourceClass] =
		useState("standard");
	const [reservedBlockStartAt, setReservedBlockStartAt] = useState(
		toLocalDateTimeValue(new Date()),
	);
	const [reservedBlockEndAt, setReservedBlockEndAt] = useState(
		toLocalDateTimeValue(addHours(new Date(), 2)),
	);
	const [reservedBlockNotes, setReservedBlockNotes] = useState("");

	const updateReservationStatusMutation = useMutation({
		mutationFn: async ({
			id,
			status,
		}: {
			id: string;
			status: "approved" | "rejected" | "cancelled";
		}) => updateAdminPlatformReservationStatus(id, { status }),
		onSuccess: async (_reservation, variables) => {
			toast.success(`Reservation ${variables.status}`);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformReservations(),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformOverview(),
			});
		},
		onError: (err) =>
			toast.error("Failed to update reservation", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const createReservedBlockMutation = useMutation({
		mutationFn: async () =>
			createAdminPlatformReservation({
				username: "",
				resourceClass: reservedBlockResourceClass,
				type: "admin-reserved-block",
				priorityTier: "admin-critical",
				adminOverride: true,
				templateRef: "",
				userScopeId: "",
				startAt: toRFC3339(reservedBlockStartAt),
				endAt: toRFC3339(reservedBlockEndAt),
				notes: reservedBlockNotes.trim(),
				metadata: { reservedFor: "curated-demo" },
			}),
		onSuccess: async () => {
			toast.success("Reserved curated-demo block created");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformReservations(),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformOverview(),
			});
		},
		onError: (err) =>
			toast.error("Failed to create reserved block", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return {
		reservedBlockResourceClass,
		setReservedBlockResourceClass,
		reservedBlockStartAt,
		setReservedBlockStartAt,
		reservedBlockEndAt,
		setReservedBlockEndAt,
		reservedBlockNotes,
		setReservedBlockNotes,
		updateReservationStatusMutation,
		createReservedBlockMutation,
	};
}

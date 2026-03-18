import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import type { PlatformReservationView } from "@/lib/api-client-platform";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type ViewMode = "month" | "week";

type DayReservation = {
	id: string;
	label: string;
	status: string;
};

type CalendarDay = {
	date: Date;
	inCurrentMonth: boolean;
	reservations: DayReservation[];
};

function startOfDay(date: Date): Date {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		0,
		0,
		0,
		0,
	);
}

function endOfDay(date: Date): Date {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		23,
		59,
		59,
		999,
	);
}

function startOfWeek(date: Date): Date {
	const day = date.getDay();
	return addDays(startOfDay(date), -day);
}

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() + days,
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
		date.getMilliseconds(),
	);
}

function withClock(day: Date, source: Date): Date {
	const next = new Date(day);
	next.setHours(source.getHours(), source.getMinutes(), 0, 0);
	return next;
}

function toLocalDateTimeValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date | null {
	if (!value || !value.trim()) {
		return null;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}
	return parsed;
}

function overlapsDay(
	reservation: PlatformReservationView,
	dayStart: Date,
	dayEnd: Date,
): boolean {
	const reservationStart = parseDate(reservation.startAt);
	const reservationEnd = parseDate(reservation.endAt);
	if (!reservationStart || !reservationEnd) {
		return false;
	}
	return reservationStart < dayEnd && reservationEnd > dayStart;
}

function formatReservationLabel(reservation: PlatformReservationView): string {
	const shortType = reservation.type.replace(/^scheduled-/, "");
	const template = reservation.templateRef?.trim();
	if (template) {
		return `${reservation.resourceClass} • ${template}`;
	}
	return `${reservation.resourceClass} • ${shortType}`;
}

function badgeVariantForStatus(
	status: string,
): "secondary" | "outline" | "destructive" {
	switch (status.toLowerCase()) {
		case "approved":
		case "active":
		case "running":
			return "secondary";
		case "rejected":
		case "failed":
		case "cancelled":
		case "canceled":
			return "destructive";
		default:
			return "outline";
	}
}

function isSameDate(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function monthLabel(date: Date): string {
	return date.toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	});
}

function weekLabel(weekCursor: Date): string {
	const start = startOfWeek(weekCursor);
	const end = addDays(start, 6);
	const startLabel = start.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
	const endLabel = end.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	return `${startLabel} - ${endLabel}`;
}

function buildCalendarDays(
	gridStart: Date,
	dayCount: number,
	currentMonth: number,
	reservations: PlatformReservationView[],
): CalendarDay[] {
	const days: CalendarDay[] = [];
	for (let offset = 0; offset < dayCount; offset += 1) {
		const date = addDays(gridStart, offset);
		const dayStart = startOfDay(date);
		const dayEnd = endOfDay(date);
		const dayReservations = reservations
			.filter((reservation) => overlapsDay(reservation, dayStart, dayEnd))
			.map((reservation) => ({
				id: reservation.id,
				label: formatReservationLabel(reservation),
				status: reservation.status,
			}));

		days.push({
			date,
			inCurrentMonth: date.getMonth() === currentMonth,
			reservations: dayReservations,
		});
	}
	return days;
}

function normalizeRange(a: Date, b: Date): [Date, Date] {
	return a.getTime() <= b.getTime() ? [a, b] : [b, a];
}

function isWithinRange(day: Date, start: Date, end: Date): boolean {
	const [left, right] = normalizeRange(start, end);
	const value = startOfDay(day).getTime();
	return (
		value >= startOfDay(left).getTime() && value <= startOfDay(right).getTime()
	);
}

export function PlatformReservationsCalendar(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;
	const parsedStart = parseDate(page.startAt);
	const parsedEnd = parseDate(page.endAt);
	const now = new Date();
	const startSource = parsedStart ?? now;
	const endSource = parsedEnd ?? addHours(startSource, 1);
	const reservationDurationMs =
		parsedStart && parsedEnd && parsedEnd.getTime() > parsedStart.getTime()
			? parsedEnd.getTime() - parsedStart.getTime()
			: 60 * 60 * 1000;

	const [viewMode, setViewMode] = useState<ViewMode>("month");
	const [rangeSelectionEnabled, setRangeSelectionEnabled] = useState(false);
	const [pendingRangeStart, setPendingRangeStart] = useState<Date | null>(null);
	const [monthCursor, setMonthCursor] = useState<Date>(
		startOfMonth(parsedStart ?? now),
	);
	const [weekCursor, setWeekCursor] = useState<Date>(
		startOfDay(parsedStart ?? now),
	);

	const selectedStartDay = parsedStart ? startOfDay(parsedStart) : null;
	const selectedEndDay = parsedEnd ? startOfDay(parsedEnd) : null;

	const calendarDays = useMemo(() => {
		if (viewMode === "week") {
			const weekStart = startOfWeek(weekCursor);
			return buildCalendarDays(
				weekStart,
				7,
				weekCursor.getMonth(),
				page.reservations,
			);
		}
		const monthStart = startOfMonth(monthCursor);
		const gridStart = addDays(monthStart, -monthStart.getDay());
		return buildCalendarDays(
			gridStart,
			42,
			monthCursor.getMonth(),
			page.reservations,
		);
	}, [viewMode, weekCursor, monthCursor, page.reservations]);

	const titleLabel =
		viewMode === "week" ? weekLabel(weekCursor) : monthLabel(monthCursor);

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<CardTitle>Reservation Calendar</CardTitle>
						<CardDescription>
							See existing reservations and pick request windows directly from
							the calendar.
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							variant={viewMode === "month" ? "secondary" : "outline"}
							onClick={() => setViewMode("month")}
						>
							Month
						</Button>
						<Button
							size="sm"
							variant={viewMode === "week" ? "secondary" : "outline"}
							onClick={() => setViewMode("week")}
						>
							Week
						</Button>
						<Button
							size="sm"
							variant={rangeSelectionEnabled ? "secondary" : "outline"}
							onClick={() => {
								setRangeSelectionEnabled((current) => !current);
								setPendingRangeStart(null);
							}}
						>
							Range Select
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								const today = startOfDay(new Date());
								setWeekCursor(today);
								setMonthCursor(startOfMonth(today));
							}}
						>
							Today
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								if (viewMode === "week") {
									setWeekCursor((current) => addDays(current, -7));
									return;
								}
								setMonthCursor(
									(current) =>
										new Date(current.getFullYear(), current.getMonth() - 1, 1),
								);
							}}
						>
							Prev
						</Button>
						<div className="min-w-48 text-center text-sm font-medium">
							{titleLabel}
						</div>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								if (viewMode === "week") {
									setWeekCursor((current) => addDays(current, 7));
									return;
								}
								setMonthCursor(
									(current) =>
										new Date(current.getFullYear(), current.getMonth() + 1, 1),
								);
							}}
						>
							Next
						</Button>
					</div>
				</div>
				{rangeSelectionEnabled ? (
					<CardDescription>
						Click one day for range start, then another day for range end.
						{pendingRangeStart
							? ` Pending start: ${pendingRangeStart.toLocaleDateString()}.`
							: ""}
					</CardDescription>
				) : (
					<CardDescription>
						Click any day to set reservation start/end using the current
						duration.
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
					{dayLabels.map((day) => (
						<div key={day} className="px-2 py-1 text-center font-medium">
							{day}
						</div>
					))}
				</div>
				<div className="grid grid-cols-7 gap-2">
					{calendarDays.map((day) => {
						const currentDay = startOfDay(day.date);
						const selectedBoundary =
							(selectedStartDay && isSameDate(currentDay, selectedStartDay)) ||
							(selectedEndDay && isSameDate(currentDay, selectedEndDay));
						const selectedRangeActive =
							selectedStartDay &&
							selectedEndDay &&
							isWithinRange(currentDay, selectedStartDay, selectedEndDay);
						const pendingBoundary =
							pendingRangeStart && isSameDate(currentDay, pendingRangeStart);
						const maxVisible = viewMode === "week" ? 5 : 3;
						const visibleReservations = day.reservations.slice(0, maxVisible);
						const remaining = Math.max(
							0,
							day.reservations.length - visibleReservations.length,
						);

						return (
							<button
								type="button"
								key={day.date.toISOString()}
								data-testid={`reservation-day-${toDateKey(day.date)}`}
								className={cn(
									"rounded-md border p-2 text-left transition-colors hover:bg-muted/40",
									viewMode === "week" ? "min-h-40" : "min-h-32",
									day.inCurrentMonth
										? "border-border"
										: "border-border/50 bg-muted/20 text-muted-foreground",
									selectedRangeActive && "border-primary/40 bg-primary/5",
									selectedBoundary && "ring-2 ring-primary",
									pendingBoundary && "ring-2 ring-amber-500",
								)}
								onClick={() => {
									setWeekCursor(currentDay);
									setMonthCursor(startOfMonth(currentDay));

									if (!rangeSelectionEnabled) {
										const start = withClock(currentDay, startSource);
										const end = new Date(
											start.getTime() + reservationDurationMs,
										);
										page.setStartAt(toLocalDateTimeValue(start));
										page.setEndAt(toLocalDateTimeValue(end));
										setPendingRangeStart(null);
										return;
									}

									if (!pendingRangeStart) {
										setPendingRangeStart(currentDay);
										const start = withClock(currentDay, startSource);
										const end = withClock(currentDay, endSource);
										page.setStartAt(toLocalDateTimeValue(start));
										page.setEndAt(
											toLocalDateTimeValue(
												end.getTime() > start.getTime()
													? end
													: addHours(start, 1),
											),
										);
										return;
									}

									const [rangeStartDay, rangeEndDay] = normalizeRange(
										pendingRangeStart,
										currentDay,
									);
									const start = withClock(rangeStartDay, startSource);
									let end = withClock(rangeEndDay, endSource);
									if (end.getTime() <= start.getTime()) {
										end = addHours(start, 1);
									}
									page.setStartAt(toLocalDateTimeValue(start));
									page.setEndAt(toLocalDateTimeValue(end));
									setPendingRangeStart(null);
								}}
							>
								<div className="mb-2 flex items-center justify-between">
									<span className="text-sm font-semibold">
										{viewMode === "week"
											? day.date.toLocaleDateString(undefined, {
													month: "short",
													day: "numeric",
												})
											: day.date.getDate()}
									</span>
									{day.reservations.length > 0 ? (
										<Badge variant="outline">{day.reservations.length}</Badge>
									) : null}
								</div>
								<div className="space-y-1">
									{visibleReservations.map((reservation) => (
										<div key={reservation.id} className="truncate text-[11px]">
											<Badge
												variant={badgeVariantForStatus(reservation.status)}
												className="max-w-full truncate"
												title={reservation.label}
											>
												{reservation.label}
											</Badge>
										</div>
									))}
									{remaining > 0 ? (
										<div className="text-[11px] text-muted-foreground">
											+{remaining} more
										</div>
									) : null}
								</div>
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

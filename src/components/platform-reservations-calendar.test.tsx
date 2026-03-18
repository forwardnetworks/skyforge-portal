import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformReservationsCalendar } from "./platform-reservations-calendar";

function buildPage(overrides: Record<string, unknown> = {}) {
	return {
		reservations: [],
		startAt: "2026-03-10T09:00",
		endAt: "2026-03-10T11:00",
		setStartAt: vi.fn(),
		setEndAt: vi.fn(),
		...overrides,
	} as never;
}

function lastCallArg(fn: ReturnType<typeof vi.fn>): string {
	const calls = fn.mock.calls;
	return String(calls[calls.length - 1]?.[0] ?? "");
}

describe("PlatformReservationsCalendar", () => {
	it("sets start and end by preserving request duration when clicking a day", () => {
		const setStartAt = vi.fn();
		const setEndAt = vi.fn();
		const page = buildPage({ setStartAt, setEndAt });

		render(<PlatformReservationsCalendar page={page} />);
		fireEvent.click(screen.getByTestId("reservation-day-2026-03-15"));

		expect(lastCallArg(setStartAt)).toBe("2026-03-15T09:00");
		expect(lastCallArg(setEndAt)).toBe("2026-03-15T11:00");
	});

	it("supports range select and applies the selected date span", () => {
		const setStartAt = vi.fn();
		const setEndAt = vi.fn();
		const page = buildPage({
			startAt: "2026-03-10T08:15",
			endAt: "2026-03-10T10:45",
			setStartAt,
			setEndAt,
		});

		render(<PlatformReservationsCalendar page={page} />);
		fireEvent.click(screen.getByRole("button", { name: "Range Select" }));
		fireEvent.click(screen.getByTestId("reservation-day-2026-03-12"));
		fireEvent.click(screen.getByTestId("reservation-day-2026-03-14"));

		expect(lastCallArg(setStartAt)).toBe("2026-03-12T08:15");
		expect(lastCallArg(setEndAt)).toBe("2026-03-14T10:45");
	});

	it("normalizes reverse range selection order", () => {
		const setStartAt = vi.fn();
		const setEndAt = vi.fn();
		const page = buildPage({
			startAt: "2026-03-10T07:00",
			endAt: "2026-03-10T08:00",
			setStartAt,
			setEndAt,
		});

		render(<PlatformReservationsCalendar page={page} />);
		fireEvent.click(screen.getByRole("button", { name: "Range Select" }));
		fireEvent.click(screen.getByTestId("reservation-day-2026-03-14"));
		fireEvent.click(screen.getByTestId("reservation-day-2026-03-12"));

		expect(lastCallArg(setStartAt)).toBe("2026-03-12T07:00");
		expect(lastCallArg(setEndAt)).toBe("2026-03-14T08:00");
	});
});

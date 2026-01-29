import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button component", () => {
	it("should render correctly", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: /click me/i }),
		).toBeInTheDocument();
	});

	it("should apply variants", () => {
		const { container } = render(<Button variant="destructive">Delete</Button>);
		expect(container.firstChild).toHaveClass("bg-destructive");
	});

	it("should handle click events", async () => {
		const handleClick = vi.fn();
		const user = userEvent.setup();

		render(<Button onClick={handleClick}>Action</Button>);

		await user.click(screen.getByRole("button", { name: /action/i }));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should be disabled when prop is set", () => {
		render(<Button disabled>Disabled</Button>);
		expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
	});
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigChangesNewRunCard } from "./config-changes-new-run-card";

function makePage(overrides: Record<string, unknown> = {}) {
	return {
		targetType: "deployment",
		setTargetType: vi.fn(),
		targetRef: "",
		setTargetRef: vi.fn(),
		targetName: "",
		setTargetName: vi.fn(),
		sourceKind: "structured-patch",
		setSourceKind: vi.fn(),
		executionMode: "dry-run",
		setExecutionMode: vi.fn(),
		summary: "",
		setSummary: vi.fn(),
		ticketRef: "",
		setTicketRef: vi.fn(),
		specJson:
			'{\n  "devices": ["leaf-1"],\n  "operations": [{"op":"replace","path":"/nodes/leaf-1/config/0","value":"hostname leaf-1"}]\n}',
		setSpecJson: vi.fn(),
		createMutation: { mutate: vi.fn(), isPending: false },
		...overrides,
	};
}

describe("ConfigChangesNewRunCard", () => {
	it("shows the supported executable path by default", () => {
		render(<ConfigChangesNewRunCard page={makePage() as never} />);

		expect(screen.getAllByRole("combobox")[1]).toHaveTextContent("Structured Patch");
		expect(screen.getByText("Executable Path")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("deployment-id")).toBeInTheDocument();
	});

	it("shows review-only guidance when target is not deployment", () => {
		render(
			<ConfigChangesNewRunCard
				page={
					makePage({
						targetType: "snapshot",
						sourceKind: "config-snippet",
					}) as never
				}
			/>,
		);

		expect(screen.getByText("Review Only")).toBeInTheDocument();
		expect(
			screen.getByText(/Only deployment targets are executable today/i),
		).toBeInTheDocument();
	});

	it("wires summary and create actions through page callbacks", () => {
		const page = makePage();
		render(<ConfigChangesNewRunCard page={page as never} />);

		fireEvent.change(screen.getByPlaceholderText("Allow ACL for demo path"), {
			target: { value: "Patch ACL" },
		});
		expect(page.setSummary).toHaveBeenCalledWith("Patch ACL");

		fireEvent.click(screen.getByRole("button", { name: /create change run/i }));
		expect(page.createMutation.mutate).toHaveBeenCalled();
	});
});

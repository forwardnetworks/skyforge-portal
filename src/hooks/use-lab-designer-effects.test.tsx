import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { defaultLabDesignerImportDir } from "./lab-designer-import-defaults";
import { useLabDesignerImportPrefsEffect } from "./use-lab-designer-effects";

function ImportPrefsHarness() {
	const [importSource, setImportSource] = useState<"user" | "blueprints">(
		"blueprints",
	);
	const [importDir, setImportDir] = useState("kne");

	useLabDesignerImportPrefsEffect({
		importOpen: true,
		userId: "user-1",
		importSource,
		importDir,
		setImportSource,
		setImportDir,
		userRepoSource: "user",
	});

	return (
		<div>
			<div data-testid="source">{importSource}</div>
			<div data-testid="dir">{importDir}</div>
			<button
				type="button"
				onClick={() => {
					setImportSource("user");
					setImportDir(defaultLabDesignerImportDir("user"));
				}}
			>
				switch-user
			</button>
		</div>
	);
}

describe("useLabDesignerImportPrefsEffect", () => {
	beforeEach(() => {
		const storage = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				getItem: vi.fn((key: string) => storage.get(key) ?? null),
				setItem: vi.fn((key: string, value: string) => {
					storage.set(key, value);
				}),
				removeItem: vi.fn((key: string) => {
					storage.delete(key);
				}),
			},
		});
	});

	it("hydrates stale prefs once and allows switching to the user KNE designer dir", async () => {
		window.localStorage.setItem(
			"skyforge.labDesigner.importPrefs.user-1",
			JSON.stringify({ source: "blueprints", dir: "netlab" }),
		);

		render(<ImportPrefsHarness />);

		await waitFor(() => {
			expect(screen.getByTestId("source")).toHaveTextContent("blueprints");
			expect(screen.getByTestId("dir")).toHaveTextContent("kne");
		});

		await userEvent.click(screen.getByRole("button", { name: "switch-user" }));

		await waitFor(() => {
			expect(screen.getByTestId("source")).toHaveTextContent("user");
			expect(screen.getByTestId("dir")).toHaveTextContent("kne/designer");
		});
	});
});

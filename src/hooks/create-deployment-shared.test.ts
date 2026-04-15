import { describe, expect, it } from "vitest";
import { resolveLabLifetimeSelectValue } from "./create-deployment-shared";

describe("resolveLabLifetimeSelectValue", () => {
	it("returns an empty value when the managed lifetime selection is invalid", () => {
		expect(
			resolveLabLifetimeSelectValue({
				currentValue: "never",
				lifetimeManaged: true,
				lifetimeOptions: [{ value: "4" }, { value: "24" }],
			}),
		).toBe("");
	});

	it("preserves a valid managed lifetime selection", () => {
		expect(
			resolveLabLifetimeSelectValue({
				currentValue: "24",
				lifetimeManaged: true,
				lifetimeOptions: [{ value: "4" }, { value: "24" }],
			}),
		).toBe("24");
	});

	it("uses the unmanaged sentinel when lifetime policies do not apply", () => {
		expect(
			resolveLabLifetimeSelectValue({
				currentValue: "",
				lifetimeManaged: false,
				lifetimeOptions: [],
			}),
		).toBe("not_managed");
	});
});

import { describe, expect, it } from "vitest";
import {
	configChangeSourceOptions,
	defaultConfigChangeSpecJson,
} from "./config-changes-shared";

describe("config changes shared options", () => {
	it("uses change-plan as the default executable lane", () => {
		expect(configChangeSourceOptions[0]?.value).toBe("change-plan");
		expect(configChangeSourceOptions[0]?.executable).toBe(true);
	});

	it("describes the change-plan lane as forward-backed change control", () => {
		const plan = configChangeSourceOptions.find((item) => item.value === "change-plan");
		expect(plan?.executable).toBe(true);
		expect(plan?.description.toLowerCase()).toContain("forward-backed");
	});

	it("returns source-specific default spec json", () => {
		expect(defaultConfigChangeSpecJson("change-plan")).toContain(`"deploy"`);
		expect(defaultConfigChangeSpecJson("change-plan")).toContain(`"verify"`);
	});
});

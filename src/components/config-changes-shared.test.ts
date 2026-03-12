import { describe, expect, it } from "vitest";
import {
	configChangeSourceOptions,
	defaultConfigChangeSpecJson,
} from "./config-changes-shared";

describe("config changes shared options", () => {
	it("uses structured-patch as the first executable default lane", () => {
		expect(configChangeSourceOptions[0]?.value).toBe("structured-patch");
		expect(configChangeSourceOptions[0]?.executable).toBe(true);
	});

	it("marks ansible and shell as executable bundle-backed lanes", () => {
		const ansible = configChangeSourceOptions.find((item) => item.value === "ansible-playbook");
		const shell = configChangeSourceOptions.find((item) => item.value === "shell-script");
		expect(ansible?.executable).toBe(true);
		expect(shell?.executable).toBe(true);
		expect(ansible?.description.toLowerCase()).toContain("executable path");
		expect(shell?.description.toLowerCase()).toContain("executable path");
	});

	it("returns source-specific default spec json", () => {
		expect(defaultConfigChangeSpecJson("structured-patch")).toContain(`"operations"`);
		expect(defaultConfigChangeSpecJson("netlab-model")).toContain(`"template"`);
		expect(defaultConfigChangeSpecJson("config-snippet")).toContain(`"snippet"`);
	});
});

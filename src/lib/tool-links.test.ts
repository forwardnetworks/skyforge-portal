import { describe, expect, it } from "vitest";
import { buildLoginUrl } from "./skyforge-config";
import {
	CODER_NEXT_PATH,
	buildCoderLaunchUrl,
	buildToolLaunchUrl,
} from "./tool-links";

describe("tool links", () => {
	it("builds coder launch URL through login flow", () => {
		expect(CODER_NEXT_PATH).toBe("/coder/");
		expect(buildCoderLaunchUrl()).toBe(buildLoginUrl("/coder/"));
	});

	it("returns the direct tool path once authenticated", () => {
		expect(
			buildCoderLaunchUrl({ authMode: "local", authenticated: true }),
		).toBe("/coder/");
		expect(
			buildToolLaunchUrl("/nautobot/", {
				authMode: "local",
				authenticated: true,
			}),
		).toBe("/nautobot/");
	});
});

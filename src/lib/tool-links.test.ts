import { describe, expect, it } from "vitest";
import { buildLoginUrl } from "./skyforge-config";
import { CODER_NEXT_PATH, buildCoderLaunchUrl } from "./tool-links";

describe("tool links", () => {
	it("builds coder launch URL through login flow", () => {
		expect(CODER_NEXT_PATH).toBe("/coder/");
		expect(buildCoderLaunchUrl()).toBe(buildLoginUrl("/coder/"));
	});
});

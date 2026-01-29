import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
	it("should merge class names", () => {
		expect(cn("class1", "class2")).toBe("class1 class2");
	});

	it("should handle conditional classes", () => {
		expect(cn("class1", true && "class2", false && "class3")).toBe(
			"class1 class2",
		);
	});

	it("should handle tailwind conflicts (merge)", () => {
		expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
	});

	it("should handle arrays and objects", () => {
		expect(cn(["class1", "class2"], { class3: true, class4: false })).toBe(
			"class1 class2 class3",
		);
	});
});

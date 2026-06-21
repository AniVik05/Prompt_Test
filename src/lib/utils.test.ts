import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (class name utility)", () => {
  it("merges class names", () => {
    expect(cn("text-red-500", "bg-blue-200")).toBe("text-red-500 bg-blue-200");
  });

  it("resolves conflicting tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles falsy inputs", () => {
    expect(cn("base", false, "extra")).toBe("base extra");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });
});

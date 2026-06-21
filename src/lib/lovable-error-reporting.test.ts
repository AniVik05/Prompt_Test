import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportLovableError } from "./lovable-error-reporting";

describe("reportLovableError", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore window to original state
    if (originalWindow === undefined) {
      // @ts-expect-error -- cleaning up test environment
      delete globalThis.window;
    }
  });

  it("does nothing when window is undefined (server-side)", () => {
    // @ts-expect-error -- simulating server environment
    delete globalThis.window;
    // Should not throw
    expect(() => reportLovableError(new Error("test"))).not.toThrow();
  });

  it("calls captureException when __lovableEvents is available", () => {
    const mockCapture = vi.fn();
    // @ts-expect-error -- simulating browser environment
    globalThis.window = {
      location: { pathname: "/test-page" },
      __lovableEvents: { captureException: mockCapture },
    };

    const error = new Error("test error");
    reportLovableError(error, { extra: "context" });

    expect(mockCapture).toHaveBeenCalledOnce();
    expect(mockCapture).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        source: "react_error_boundary",
        route: "/test-page",
        extra: "context",
      }),
      expect.objectContaining({
        mechanism: "react_error_boundary",
        handled: false,
        severity: "error",
      }),
    );
  });

  it("does nothing when __lovableEvents is not present on window", () => {
    // @ts-expect-error -- simulating browser environment without lovable
    globalThis.window = { location: { pathname: "/" } };

    expect(() => reportLovableError(new Error("test"))).not.toThrow();
  });

  it("does nothing when captureException is not defined", () => {
    // @ts-expect-error -- simulating partial lovable setup
    globalThis.window = {
      location: { pathname: "/" },
      __lovableEvents: {},
    };

    expect(() => reportLovableError(new Error("test"))).not.toThrow();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("error-capture", () => {
  let errorHandler: ((event: unknown) => void) | undefined;
  let rejectionHandler: ((event: unknown) => void) | undefined;
  const originalAddEventListener = globalThis.addEventListener;

  beforeEach(() => {
    vi.useFakeTimers();
    errorHandler = undefined;
    rejectionHandler = undefined;

    // Intercept addEventListener calls so we can capture the callbacks
    // the module registers on import.
    globalThis.addEventListener = vi.fn((type: string, handler: unknown) => {
      if (type === "error") errorHandler = handler as (event: unknown) => void;
      if (type === "unhandledrejection") rejectionHandler = handler as (event: unknown) => void;
    }) as typeof globalThis.addEventListener;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.addEventListener = originalAddEventListener;
  });

  it("consumeLastCapturedError returns undefined when nothing has been captured", async () => {
    const mod = await import("./error-capture?fresh=1");
    expect(mod.consumeLastCapturedError()).toBeUndefined();
  });

  it("consumeLastCapturedError returns and clears the captured error", async () => {
    const mod = await import("./error-capture?fresh=2");

    const testError = new Error("test error");
    errorHandler?.({ error: testError });

    const captured = mod.consumeLastCapturedError();
    expect(captured).toBe(testError);

    // Second call should return undefined (consumed)
    expect(mod.consumeLastCapturedError()).toBeUndefined();
  });

  it("consumeLastCapturedError returns undefined after TTL expires", async () => {
    const mod = await import("./error-capture?fresh=3");

    errorHandler?.({ error: new Error("expired") });

    // Advance past the 5-second TTL
    vi.advanceTimersByTime(6000);

    expect(mod.consumeLastCapturedError()).toBeUndefined();
  });

  it("captures unhandled rejections", async () => {
    const mod = await import("./error-capture?fresh=4");

    const reason = new Error("rejected promise");
    rejectionHandler?.({ reason });

    const captured = mod.consumeLastCapturedError();
    expect(captured).toBe(reason);
  });

  it("latest error overwrites previous error", async () => {
    const mod = await import("./error-capture?fresh=5");

    errorHandler?.({ error: new Error("first") });
    errorHandler?.({ error: new Error("second") });

    const captured = mod.consumeLastCapturedError() as Error;
    expect(captured.message).toBe("second");
  });

  it("falls back to event itself when error property is missing", async () => {
    const mod = await import("./error-capture?fresh=6");

    const event = { someOtherProp: "value" };
    errorHandler?.(event);

    const captured = mod.consumeLastCapturedError();
    expect(captured).toBe(event);
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { getServerConfig } from "./config.server";

describe("getServerConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns nodeEnv matching process.env.NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    const config = getServerConfig();
    expect(config.nodeEnv).toBe("production");
  });

  it("returns undefined nodeEnv when NODE_ENV is not set", () => {
    delete process.env.NODE_ENV;
    const config = getServerConfig();
    expect(config.nodeEnv).toBeUndefined();
  });
});

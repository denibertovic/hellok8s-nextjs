import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/server/api/trpc";

// Mock the os module before importing the router
vi.mock("os", () => ({
  default: {
    hostname: vi.fn(),
  },
}));

import { postRouter } from "../post";

describe("postRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getHostname", () => {
    it("should return the mocked hostname", async () => {
      // Arrange
      const expectedHostname = "test-hostname-123";
      const os = await import("os");
      const mockHostname = vi.mocked(os.default.hostname);
      mockHostname.mockReturnValue(expectedHostname);

      // Create a caller for testing
      const createCaller = createCallerFactory(postRouter);
      const caller = createCaller({ headers: new Headers() });

      // Act
      const result = await caller.getHostname();

      // Assert
      expect(result).toEqual({
        hostname: expectedHostname,
      });
      expect(mockHostname).toHaveBeenCalledOnce();
    });

    it("should call os.hostname() when invoked", async () => {
      // Arrange
      const os = await import("os");
      const mockHostname = vi.mocked(os.default.hostname);
      mockHostname.mockReturnValue("another-hostname");

      const createCaller = createCallerFactory(postRouter);
      const caller = createCaller({ headers: new Headers() });

      // Act
      await caller.getHostname();

      // Assert
      expect(mockHostname).toHaveBeenCalledTimes(1);
    });
  });
});

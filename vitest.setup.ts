import { vi } from "vitest";

// Mock environment variables
// NODE_ENV is handled by Vitest automatically, no need to set it manually
process.env.AUTH_SECRET = "test-secret";
process.env.AUTH_URL = "http://localhost:3000";

// Mock Next.js modules that don't work well in test environment
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "sqlite://test.db",
    AUTH_SECRET: "test-secret",
    AUTH_URL: "http://localhost:3000",
  },
}));

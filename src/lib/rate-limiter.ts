import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

// Define types for Express-like request/response objects
interface ExpressLikeRequest {
  ip: string;
  headers: Record<string, string>;
  get: (name: string) => string | null;
  method: string;
  url: string;
  connection: { remoteAddress: string };
}

interface ExpressLikeResponse {
  status: (code: number) => ExpressLikeResponse;
  json: (data: unknown) => ExpressLikeResponse;
  send: (data: unknown) => ExpressLikeResponse;
  set: (name: string, value: string) => ExpressLikeResponse;
  setHeader: (name: string, value: string) => ExpressLikeResponse;
  getHeader: (name: string) => string | undefined;
  removeHeader: (name: string) => ExpressLikeResponse;
  end: (data?: unknown) => ExpressLikeResponse;
  headersSent: boolean;
  locals: Record<string, unknown>;
}

type NoOpMiddleware = (
  req: ExpressLikeRequest,
  res: ExpressLikeResponse,
  next: () => void,
) => void;

// Create Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

function getRedisClient() {
  // Skip Redis connection in test environment
  if (process.env.NODE_ENV === "test") {
    throw new Error("Redis disabled in test environment");
  }

  if (!redisClient) {
    // Use REDIS_URL if available, otherwise fallback to local Redis with devenv password
    const redisUrl =
      env.REDIS_URL ?? "redis://:devredispassword@localhost:6379";

    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on("error", (err) => {
      console.warn("Redis rate limiter error:", err);
    });

    redisClient.connect().catch((err) => {
      console.warn("Failed to connect to Redis for rate limiting:", err);
    });
  }

  return redisClient;
}

// Union type for rate limiters - either test no-ops or production rate limiters
type RateLimiters =
  | {
      authRateLimit: NoOpMiddleware;
      apiRateLimit: NoOpMiddleware;
      isTest: true;
    }
  | {
      authRateLimit: RateLimitRequestHandler;
      apiRateLimit: RateLimitRequestHandler;
      isTest: false;
    };

// Create express-rate-limit instances
function createRateLimiters(): RateLimiters {
  if (process.env.NODE_ENV === "test") {
    // Return no-op limiters for test environment
    const noOp: NoOpMiddleware = (
      req: ExpressLikeRequest,
      res: ExpressLikeResponse,
      next: () => void,
    ) => next();
    return { authRateLimit: noOp, apiRateLimit: noOp, isTest: true };
  }

  // Valid eslint-disable: express-rate-limit returns incompatible types for Next.js adapter
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const authRateLimit: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many authentication attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => getRedisClient().sendCommand(args),
      prefix: "auth_rate_limit:",
    }),
  });

  // Valid eslint-disable: express-rate-limit returns incompatible types for Next.js adapter
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const apiRateLimit: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => getRedisClient().sendCommand(args),
      prefix: "api_rate_limit:",
    }),
  });

  // Valid eslint-disable: express-rate-limit returns types incompatible with our union
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { authRateLimit, apiRateLimit, isTest: false };
}

let rateLimiters: RateLimiters | null = null;

function getRateLimiters(): RateLimiters {
  rateLimiters ??= createRateLimiters();
  return rateLimiters;
}

// Proper Express-compatible adapter for Next.js
async function applyRateLimit(
  req: NextRequest,
  // Valid eslint-disable: Union type includes 'any' from express-rate-limit incompatibility
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  limiter: RateLimitRequestHandler | NoOpMiddleware,
): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "test") {
    return null; // Skip in test environment
  }

  return new Promise((resolve) => {
    // Create proper Express-like request object
    const mockReq: ExpressLikeRequest = {
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0] ??
        req.headers.get("x-real-ip") ??
        "127.0.0.1",
      headers: Object.fromEntries(req.headers.entries()),
      get: (name: string) => req.headers.get(name),
      method: req.method,
      url: req.url,
      connection: { remoteAddress: "127.0.0.1" },
    };

    // Create proper Express-like response object
    let statusCode = 200;
    let responseData: unknown = null;
    const responseHeaders: Record<string, string> = {};

    const mockRes: ExpressLikeResponse = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: unknown) => {
        responseData = data;
        resolve(
          NextResponse.json(data, {
            status: statusCode,
            headers: responseHeaders,
          }),
        );
        return mockRes;
      },
      send: (data: unknown) => {
        responseData = data;
        resolve(
          NextResponse.json(
            { error: data },
            { status: statusCode, headers: responseHeaders },
          ),
        );
        return mockRes;
      },
      set: (name: string, value: string) => {
        responseHeaders[name] = value;
        return mockRes;
      },
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
        return mockRes;
      },
      getHeader: (name: string) => responseHeaders[name],
      removeHeader: (name: string) => {
        delete responseHeaders[name];
        return mockRes;
      },
      end: (data?: unknown) => {
        if (data) responseData = data;
        resolve(
          NextResponse.json(
            typeof responseData === "string"
              ? { error: responseData }
              : responseData,
            { status: statusCode, headers: responseHeaders },
          ),
        );
        return mockRes;
      },
      headersSent: false,
      locals: {},
    };

    // Apply the rate limiter
    // Valid eslint-disable: express-rate-limit callback has incompatible types for Next.js
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    limiter(mockReq, mockRes, (error?: unknown) => {
      if (error) {
        resolve(
          NextResponse.json({ error: "Rate limit error" }, { status: 500 }),
        );
      } else {
        resolve(null); // Continue - rate limit passed
      }
    });
  });
}

// Next.js-compatible rate limiting functions
export async function checkAuthRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  // Valid eslint-disable: getRateLimiters returns union with express-rate-limit incompatibilities
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { authRateLimit } = getRateLimiters();
  return applyRateLimit(req, authRateLimit);
}

export async function checkApiRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  // Valid eslint-disable: getRateLimiters returns union with express-rate-limit incompatibilities
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { apiRateLimit } = getRateLimiters();
  return applyRateLimit(req, apiRateLimit);
}

// Helper function for tRPC/custom usage
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ success: boolean; remaining: number }> {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === "test") {
    return { success: true, remaining: limit };
  }

  try {
    const client = getRedisClient();
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `custom_rate_limit:${key}:${window}`;

    const current = await client.incr(redisKey);

    if (current === 1) {
      // Set expiration for the key
      await client.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch (error) {
    console.warn("Rate limit check failed:", error);
    // On Redis error, allow the request (fail open)
    return { success: true, remaining: 0 };
  }
}

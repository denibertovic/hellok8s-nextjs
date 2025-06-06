import { handlers } from "@/server/auth";
import { checkAuthRateLimit } from "@/lib/rate-limiter";
import { type NextRequest, NextResponse } from "next/server";

export const { GET } = handlers;

export async function POST(req: NextRequest) {
  // Apply rate limiting to auth POST requests (login attempts)
  try {
    const rateLimitResponse = await checkAuthRateLimit(req);
    if (rateLimitResponse) {
      // Return a NextAuth-compatible error response
      return NextResponse.json(
        {
          error: "TooManyRequests",
          message: "Too many login attempts. Please try again in 15 minutes.",
          url: `${req.nextUrl.origin}/admin/login?error=TooManyRequests`,
        },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error(
      "Rate limiting failed, continuing without rate limit:",
      error,
    );
    // Continue without rate limiting if it fails
  }

  return handlers.POST(req);
}

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require admin authentication
  const adminRoutes = ["/admin", "/api/posts"];

  // Handle login page - redirect if already authenticated
  if (pathname === "/admin/login") {
    const session = await auth();
    if (session?.user) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Check if the current path requires admin auth
  const requiresAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (requiresAdmin) {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 },
        );
      } else {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // Check admin privileges
    if (!session.user.isSuperuser) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Admin privileges required" },
          { status: 403 },
        );
      } else {
        return NextResponse.redirect(
          new URL("/admin/login?error=unauthorized", request.url),
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match admin routes
    "/admin/:path*",
    // Match API routes that need protection
    "/api/posts/:path*",
    // Add other protected routes here
  ],
};

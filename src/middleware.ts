import { auth } from "@/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Protect these routes - users must be authenticated to access
  const protectedPaths = ["/upload", "/account", "/admin"];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/upload/:path*",
    "/account/:path*",
    "/admin/:path*",
    // Add more protected routes here as needed
    // Note: Auth API routes are automatically excluded
  ],
};


import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // You can add additional logic here if needed
    // For example, you could check user roles or permissions
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Only allow access if user has a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect these routes - users must be authenticated to access
export const config = {
  matcher: [
    "/upload/:path*",
    "/account/:path*",
    "/admin/:path*",
    // Add more protected routes here as needed
    // Example: "/dashboard/:path*", "/settings/:path*"
    // Note: Auth API routes are automatically excluded
  ],
};


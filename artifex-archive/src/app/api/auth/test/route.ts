import { NextResponse } from "next/server";

// Test endpoint to check if Google OAuth is configured
export async function GET() {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    configured: hasClientId && hasClientSecret && hasNextAuthUrl && hasNextAuthSecret,
    details: {
      GOOGLE_CLIENT_ID: hasClientId ? "✓ Set" : "✗ Missing",
      GOOGLE_CLIENT_SECRET: hasClientSecret ? "✓ Set" : "✗ Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "✗ Missing",
      NEXTAUTH_SECRET: hasNextAuthSecret ? "✓ Set" : "✗ Missing",
    },
    callbackUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
    note: "Make sure this callback URL is added to Google Cloud Console as an authorized redirect URI",
  });
}


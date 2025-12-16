import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Check if a user is an admin based on their email (server-side only)
 * @param email - User's email address
 * @returns true if user is an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * Get admin status from session (server-side only)
 * @returns true if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return isAdminEmail(session?.user?.email || null);
}

/**
 * Require admin access - throws error if not admin (server-side only)
 */
export async function requireAdmin() {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    throw new Error("Admin access required");
  }
}


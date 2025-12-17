import { prisma } from "@/lib/db";
import { auth } from "@/auth/config";

export async function createContext() {
  const session = await auth();
  
  return {
    db: prisma,
    session,
    user: session?.user || null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

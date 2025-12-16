import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createContext() {
  const session = await getServerSession(authOptions);
  
  return {
    db: prisma,
    session,
    user: session?.user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

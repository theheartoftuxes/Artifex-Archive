import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { db } from "./db";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  debug: process.env.NODE_ENV === "development", // Enable debug logging in development
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        
        // Fetch user from database
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { username: true, email: true },
        });

        // Auto-generate username on first login if not set
        if (!dbUser?.username && dbUser?.email) {
          // Extract email prefix (before @)
          const emailPrefix = dbUser.email.split("@")[0];
          // Clean email prefix (remove special characters, keep only alphanumeric)
          const cleanPrefix = emailPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          // Generate random suffix (4 digits)
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          let username = `${cleanPrefix}${randomSuffix}`;
          
          // Ensure username is unique
          let attempts = 0;
          while (attempts < 10) {
            const existingUser = await db.user.findUnique({
              where: { username },
            });
            
            if (!existingUser) {
              // Username is available, update user
              await db.user.update({
                where: { id: user.id },
                data: { username },
              });
              token.username = username;
              break;
            }
            
            // Try again with different random suffix
            const newRandomSuffix = Math.floor(1000 + Math.random() * 9000);
            username = `${cleanPrefix}${newRandomSuffix}`;
            attempts++;
          }
        } else if (dbUser?.username) {
          token.username = dbUser.username;
        }
      }
      // On subsequent requests, refresh username if needed
      if (token.id && !token.username) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { username: true },
        });
        if (dbUser?.username) {
          token.username = dbUser.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
};

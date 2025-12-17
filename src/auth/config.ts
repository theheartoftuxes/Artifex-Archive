import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" }, // Critical: JWT for Vercel/Edge compatibility
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create or update user in database on sign in
      if (user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user
            await prisma.user.create({
              data: {
                id: user.id!,
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
              },
            });
          } else {
            // Update existing user if needed
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
              },
            });
          }
        } catch (error) {
          console.error("Error creating/updating user:", error);
          // Don't block sign in if DB update fails
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        
        try {
          // Fetch user from database to get/update username
          const dbUser = await prisma.user.findUnique({
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
              const existingUser = await prisma.user.findUnique({
                where: { username },
              });
              
              if (!existingUser) {
                // Username is available, update user
                await prisma.user.update({
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
        } catch (error) {
          // Log error but don't fail authentication
          console.error("Error in JWT callback:", error);
        }
      }
      
      // On subsequent requests, refresh username if needed
      if (token.id && !token.username) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { username: true },
          });
          if (dbUser?.username) {
            token.username = dbUser.username;
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
});


import { z } from "zod";
import { router, protectedProcedure, rateLimitedMutation } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  // Get current user's profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Update user profile
  updateProfile: rateLimitedMutation
    .input(
      z.object({
        username: z.string().min(3).max(30).optional(),
        bio: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Check if username is already taken (if provided)
      if (input.username) {
        const existingUser = await ctx.db.user.findFirst({
          where: {
            username: input.username,
            id: { not: ctx.user.id },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken",
          });
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.username !== undefined && { username: input.username }),
          ...(input.bio !== undefined && { bio: input.bio }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          bio: true,
          createdAt: true,
        },
      });

      return updatedUser;
    }),
});


import { z } from "zod";
import { Visibility } from "@prisma/client";
import { router, protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { isAdminEmail } from "@/lib/admin";

// Admin procedure - checks if user is admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user?.email) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User email not found",
    });
  }

  if (!isAdminEmail(ctx.user.email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next();
});

export const adminRouter = router({
  // Check if current user is admin (public procedure for client-side checks)
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.email) {
      return false;
    }
    return isAdminEmail(ctx.user.email);
  }),

  // Get all media items (including deleted)
  getAllMediaItems: adminProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const items = await ctx.db.mediaItem.findMany({
        where: {
          // Include deleted items
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: cursor ?? 0,
        take: limit,
      });

      const total = await ctx.db.mediaItem.count();

      return {
        items,
        total,
        hasMore: (cursor ?? 0) + limit < total,
      };
    }),

  // Toggle media item visibility
  toggleVisibility: adminProcedure
    .input(
      z.object({
        mediaItemId: z.string(),
        visibility: z.nativeEnum(Visibility),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { mediaItemId, visibility } = input;

      const item = await ctx.db.mediaItem.update({
        where: { id: mediaItemId },
        data: { visibility },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return item;
    }),

  // Soft delete media item
  deleteMediaItem: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const mediaItemId = input;

      // Soft delete: set deletedAt and visibility to HIDDEN
      const item = await ctx.db.mediaItem.update({
        where: { id: mediaItemId },
        data: {
          deletedAt: new Date(),
          visibility: Visibility.HIDDEN,
        },
      });

      return { success: true, id: item.id };
    }),

  // Get all users
  getAllUsers: adminProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          isBanned: true,
          createdAt: true,
          _count: {
            select: {
              mediaItems: true,
              ratings: true,
              saves: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: cursor ?? 0,
        take: limit,
      });

      // Add isAdmin field to each user
      const usersWithAdmin = users.map((user) => ({
        ...user,
        isAdmin: user.email ? isAdminEmail(user.email) : false,
      }));

      const total = await ctx.db.user.count();

      return {
        users: usersWithAdmin,
        total,
        hasMore: (cursor ?? 0) + limit < total,
      };
    }),

  // Ban/unban user
  toggleBanUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isBanned: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, isBanned } = input;

      const user = await ctx.db.user.update({
        where: { id: userId },
        data: { isBanned },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          isBanned: true,
          createdAt: true,
          _count: {
            select: {
              mediaItems: true,
              ratings: true,
              saves: true,
            },
          },
        },
      });

      return user;
    }),

  // Get report queue (placeholder)
  getReports: adminProcedure.query(async ({ ctx }) => {
    // Placeholder - return empty array for now
    return {
      reports: [],
      total: 0,
    };
  }),
});


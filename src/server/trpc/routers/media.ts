import { z } from "zod";
import { MediaType, Visibility } from "@prisma/client";
import { router, publicProcedure, protectedProcedure, rateLimitedMutation } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { getPresignedUploadUrl, generateFileKey } from "@/lib/r2";

// Zod schemas for MediaItem
const MediaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  mediaType: z.nativeEnum(MediaType),
  mediaUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  creatorId: z.string(),
  createdAt: z.date(),
  aiModelUsed: z.string().nullable(),
  promptSummary: z.string().nullable(),
  visibility: z.nativeEnum(Visibility),
  license: z.string().nullable(),
  avgRating: z.number().nullable(),
  ratingCount: z.number(),
  ratingTotal: z.number(),
  saveCount: z.number(),
  viewCount: z.number(),
  creator: z.object({
    id: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
  }),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});

// Zod schema for MediaMetadata
const MediaMetadataSchema = z.object({
  id: z.string(),
  mediaItemId: z.string(),
  duration: z.number().nullable(),
  dimensions: z.string().nullable(),
  fileSize: z.number().nullable(),
  format: z.string().nullable(),
  bpm: z.number().nullable(),
  genre: z.string().nullable(),
});

export const mediaRouter = router({
  getAllByType: publicProcedure
    .input(
      z.object({
        mediaType: z.nativeEnum(MediaType),
        sort: z.enum(["top", "new", "trending"]),
        cursor: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .output(z.array(MediaItemSchema))
    .query(async ({ input, ctx }) => {
      const { mediaType, sort, cursor, limit } = input;

      let items;

      if (sort === "top") {
        // Sort by score using raw SQL
        // score = (COALESCE(ratingTotal::float / NULLIF(ratingCount, 0), 0) * 2) 
        //         + (saveCount * 1.5) 
        //         + LN(viewCount + 1) 
        //         - (EXTRACT(DAY FROM (NOW() - createdAt)) * 0.1)
        const result = await ctx.db.$queryRaw<Array<{ id: string }>>`
          SELECT 
            mi.id
          FROM "media_items" mi
          WHERE mi."mediaType" = ${mediaType}::"MediaType"
            AND mi."visibility" = 'PUBLIC'::"Visibility"
          ORDER BY 
            (COALESCE(mi."ratingTotal"::float / NULLIF(mi."ratingCount", 0), 0) * 2) 
            + (mi."saveCount" * 1.5) 
            + LN(mi."viewCount" + 1) 
            - (EXTRACT(DAY FROM (NOW() - mi."createdAt")) * 0.1) DESC
          LIMIT ${limit}
          OFFSET ${cursor ?? 0}
        `;

        // Fetch full items with relations
        const itemIds = result.map((item) => item.id);
        items = await ctx.db.mediaItem.findMany({
          where: {
            id: { in: itemIds },
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
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

        // Maintain order from SQL query
        const itemMap = new Map(items.map((item) => [item.id, item]));
        items = itemIds.map((id) => itemMap.get(id)!).filter(Boolean);
      } else if (sort === "new") {
        // Sort by createdAt descending
        items = await ctx.db.mediaItem.findMany({
          where: {
            mediaType,
            visibility: "PUBLIC",
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
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
      } else {
        // Sort by trending: velocity = (saveCount + ratingCount * 2) / (EXTRACT(DAY FROM (NOW() - createdAt)) + 1)
        const result = await ctx.db.$queryRaw<Array<{ id: string }>>`
          SELECT 
            mi.id
          FROM "media_items" mi
          WHERE mi."mediaType" = ${mediaType}::"MediaType"
            AND mi."visibility" = 'PUBLIC'::"Visibility"
          ORDER BY 
            (mi."saveCount" + mi."ratingCount" * 2)::float / 
            (EXTRACT(DAY FROM (NOW() - mi."createdAt")) + 1) DESC
          LIMIT ${limit}
          OFFSET ${cursor ?? 0}
        `;

        // Fetch full items with relations
        const itemIds = result.map((item) => item.id);
        items = await ctx.db.mediaItem.findMany({
          where: {
            id: { in: itemIds },
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
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

        // Maintain order from SQL query
        const itemMap = new Map(items.map((item) => [item.id, item]));
        items = itemIds.map((id) => itemMap.get(id)!).filter(Boolean);
      }

      return items;
    }),

  getById: publicProcedure
    .input(z.string())
    .output(
      z.object({
        mediaItem: MediaItemSchema,
        metadata: MediaMetadataSchema.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const mediaItem = await ctx.db.mediaItem.findUnique({
        where: {
          id: input,
          visibility: "PUBLIC",
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          metadata: true,
        },
      });

      if (!mediaItem) {
        throw new Error("Media item not found");
      }

      const { metadata, ...item } = mediaItem;

      return {
        mediaItem: item,
        metadata: metadata ?? undefined,
      };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(30),
      })
    )
    .output(z.array(MediaItemSchema))
    .query(async ({ input, ctx }) => {
      const { query, limit } = input;

      if (!query.trim()) {
        return [];
      }

      // Use Prisma raw query for optimal full-text search performance
      // Boost tags separately by joining Tag table and adding tag matches to score
      const searchPattern = `%${query}%`;
      
      // First, get item IDs with scores (rank + tag boost)
      const results = await ctx.db.$queryRaw<Array<{ id: string; score: number }>>`
        SELECT 
          mi.id,
          (ts_rank(mi."searchVector", plainto_tsquery('english', ${query})) + 
           COALESCE(SUM(CASE 
             WHEN LOWER(t.name) LIKE LOWER(${searchPattern}) THEN 0.5 
             ELSE 0 
           END), 0)) AS score
        FROM "media_items" mi
        LEFT JOIN "_MediaItemToTag" mt ON mi.id = mt."A"
        LEFT JOIN "tags" t ON mt."B" = t.id
        WHERE mi."visibility" = 'PUBLIC'::"Visibility"
          AND mi."searchVector" @@ plainto_tsquery('english', ${query})
        GROUP BY mi.id
        ORDER BY score DESC
        LIMIT ${limit}
      `;

      if (results.length === 0) {
        return [];
      }

      // Get all item IDs to fetch full relations
      const itemIds = results.map((r) => r.id);

      // Fetch full items with relations
      const items = await ctx.db.mediaItem.findMany({
        where: {
          id: { in: itemIds },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
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

      // Maintain order from SQL query (by rank + tagBoost)
      const itemMap = new Map(items.map((item) => [item.id, item]));
      return itemIds.map((id) => itemMap.get(id)!).filter(Boolean);
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        mediaType: z.string(),
        contentType: z.string().optional(),
      })
    )
    .output(
      z.object({
        uploadUrl: z.string(),
        publicUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { filename, mediaType, contentType } = input;

      // Generate unique key for the file
      const key = generateFileKey(ctx.user.id, filename, mediaType);

      // Get content type from input or infer from filename
      const fileContentType =
        contentType ||
        (() => {
          const ext = filename.split(".").pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            svg: "image/svg+xml",
            mp4: "video/mp4",
            webm: "video/webm",
            mov: "video/quicktime",
            avi: "video/x-msvideo",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            ogg: "audio/ogg",
            flac: "audio/flac",
            zip: "application/zip",
            pdf: "application/pdf",
            txt: "text/plain",
            md: "text/markdown",
          };
          return mimeTypes[ext || ""] || "application/octet-stream";
        })();

      // Generate presigned URL
      const { uploadUrl, publicUrl, thumbnailUrl } = await getPresignedUploadUrl(
        key,
        fileContentType
      );

      return {
        uploadUrl,
        publicUrl,
        thumbnailUrl,
        key,
      };
    }),

  create: rateLimitedMutation
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        mediaType: z.nativeEnum(MediaType),
        mediaUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        aiModelUsed: z.string().optional(),
        promptSummary: z.string().optional(),
        tags: z.array(z.string()).optional(),
        license: z.string().optional(),
        visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
      })
    )
    .output(MediaItemSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { tags, ...mediaData } = input;

      // Create or connect tags
      const tagConnections = tags
        ? await Promise.all(
            tags.map(async (tagName) => {
              // Normalize tag name (lowercase, trim)
              const normalizedName = tagName.toLowerCase().trim();
              
              // Try to find existing tag
              let tag = await ctx.db.tag.findUnique({
                where: { name: normalizedName },
              });

              // Create tag if it doesn't exist
              if (!tag) {
                tag = await ctx.db.tag.create({
                  data: { name: normalizedName },
                });
              }

              return { id: tag.id };
            })
          )
        : [];

      // Create the media item
      const newItem = await ctx.db.mediaItem.create({
        data: {
          ...mediaData,
          creatorId: ctx.user.id,
          tags: {
            connect: tagConnections,
          },
          // Create placeholder metadata
          metadata: {
            create: {
              // Placeholder values - can be updated later when file is processed
              format: mediaData.mediaUrl.split(".").pop()?.toLowerCase() || null,
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
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

      // Create activity record for upload
      await ctx.db.activity.create({
        data: {
          userId: ctx.user.id,
          action: "UPLOAD",
          mediaItemId: newItem.id,
        },
      });

      return newItem;
    }),

  rate: rateLimitedMutation
    .input(
      z.object({
        mediaItemId: z.string(),
        value: z.number().min(1).max(5),
      })
    )
    .output(
      z.object({
        avgRating: z.number().nullable(),
        ratingCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { mediaItemId, value } = input;

      // Use transaction to ensure consistency
      const result = await ctx.db.$transaction(async (tx) => {
        // Check if media item exists
        const mediaItem = await tx.mediaItem.findUnique({
          where: { id: mediaItemId },
          select: { id: true, ratingTotal: true, ratingCount: true },
        });

        if (!mediaItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Media item not found",
          });
        }

        // Check if rating already exists
        const existingRating = await tx.rating.findUnique({
          where: {
            userId_mediaItemId: {
              userId: ctx.user.id,
              mediaItemId: mediaItemId,
            },
          },
        });

        let newRatingTotal = mediaItem.ratingTotal;
        let newRatingCount = mediaItem.ratingCount;
        const oldValue = existingRating?.value;

        if (existingRating) {
          // Update existing rating
          await tx.rating.update({
            where: {
              userId_mediaItemId: {
                userId: ctx.user.id,
                mediaItemId: mediaItemId,
              },
            },
            data: { value },
          });

          // Adjust totals: subtract old value, add new value
          newRatingTotal = mediaItem.ratingTotal - oldValue + value;
          // ratingCount stays the same
        } else {
          // Create new rating
          await tx.rating.create({
            data: {
              userId: ctx.user.id,
              mediaItemId: mediaItemId,
              value,
            },
          });

          // Increment totals
          newRatingTotal = mediaItem.ratingTotal + value;
          newRatingCount = mediaItem.ratingCount + 1;
        }

        // Update MediaItem with new totals
        const updated = await tx.mediaItem.update({
          where: { id: mediaItemId },
          data: {
            ratingTotal: newRatingTotal,
            ratingCount: newRatingCount,
            avgRating: newRatingCount > 0 ? newRatingTotal / newRatingCount : null,
          },
        });

        // Create activity record
        await tx.activity.create({
          data: {
            userId: ctx.user.id,
            action: "RATE",
            mediaItemId: mediaItemId,
          },
        });

        return {
          avgRating: updated.avgRating,
          ratingCount: updated.ratingCount,
        };
      });

      return result;
    }),

  toggleSave: rateLimitedMutation
    .input(
      z.object({
        mediaItemId: z.string(),
      })
    )
    .output(
      z.object({
        isSaved: z.boolean(),
        saveCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { mediaItemId } = input;

      // Use transaction to ensure consistency
      const result = await ctx.db.$transaction(async (tx) => {
        // Check if media item exists
        const mediaItem = await tx.mediaItem.findUnique({
          where: { id: mediaItemId },
          select: { id: true, saveCount: true },
        });

        if (!mediaItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Media item not found",
          });
        }

        // Check if save exists
        const existingSave = await tx.save.findUnique({
          where: {
            userId_mediaItemId: {
              userId: ctx.user.id,
              mediaItemId: mediaItemId,
            },
          },
        });

        let isSaved: boolean;
        let newSaveCount: number;

        if (existingSave) {
          // Delete save (unsave)
          await tx.save.delete({
            where: {
              userId_mediaItemId: {
                userId: ctx.user.id,
                mediaItemId: mediaItemId,
              },
            },
          });
          isSaved = false;
          newSaveCount = mediaItem.saveCount - 1;
        } else {
          // Create save
          await tx.save.create({
            data: {
              userId: ctx.user.id,
              mediaItemId: mediaItemId,
            },
          });
          isSaved = true;
          newSaveCount = mediaItem.saveCount + 1;
        }

        // Update MediaItem saveCount
        const updated = await tx.mediaItem.update({
          where: { id: mediaItemId },
          data: {
            saveCount: newSaveCount,
          },
        });

        // Create activity record
        await tx.activity.create({
          data: {
            userId: ctx.user.id,
            action: "SAVE",
            mediaItemId: mediaItemId,
          },
        });

        return {
          isSaved,
          saveCount: updated.saveCount,
        };
      });

      return result;
    }),

  incrementView: publicProcedure
    .input(
      z.object({
        mediaItemId: z.string(),
      })
    )
    .output(
      z.object({
        viewCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { mediaItemId } = input;

      // Use transaction to ensure consistency
      const result = await ctx.db.$transaction(async (tx) => {
        // Check if media item exists
        const mediaItem = await tx.mediaItem.findUnique({
          where: { id: mediaItemId },
          select: { id: true },
        });

        if (!mediaItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Media item not found",
          });
        }

        // Increment view count
        const updated = await tx.mediaItem.update({
          where: { id: mediaItemId },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });

        // Create activity record (userId is optional for anonymous views)
        await tx.activity.create({
          data: {
            userId: ctx.user?.id ?? null,
            action: "VIEW",
            mediaItemId: mediaItemId,
          },
        });

        return {
          viewCount: updated.viewCount,
        };
      });

      return result;
    }),

  getSaved: protectedProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .output(z.array(MediaItemSchema))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { cursor, limit } = input;

      // Get saved item IDs
      const saves = await ctx.db.save.findMany({
        where: {
          userId: ctx.user.id,
        },
        select: {
          mediaItemId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: cursor ?? 0,
        take: limit,
      });

      const itemIds = saves.map((save) => save.mediaItemId);

      if (itemIds.length === 0) {
        return [];
      }

      // Fetch full items with relations
      const items = await ctx.db.mediaItem.findMany({
        where: {
          id: { in: itemIds },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
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

      // Maintain order from saves query
      const itemMap = new Map(items.map((item) => [item.id, item]));
      return itemIds.map((id) => itemMap.get(id)!).filter(Boolean);
    }),

  getMyUploads: protectedProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .output(z.array(MediaItemSchema))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { cursor, limit } = input;

      const items = await ctx.db.mediaItem.findMany({
        where: {
          creatorId: ctx.user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
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

      return items;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        visibility: z.nativeEnum(Visibility).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .output(MediaItemSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const { id, tags, ...updateData } = input;

      // Check if user owns the media item
      const existingItem = await ctx.db.mediaItem.findUnique({
        where: { id },
        select: { creatorId: true },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media item not found",
        });
      }

      if (existingItem.creatorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own items",
        });
      }

      // Handle tags if provided
      let tagConnections;
      if (tags !== undefined) {
        tagConnections = await Promise.all(
          tags.map(async (tagName) => {
            const normalizedName = tagName.toLowerCase().trim();
            let tag = await ctx.db.tag.findUnique({
              where: { name: normalizedName },
            });

            if (!tag) {
              tag = await ctx.db.tag.create({
                data: { name: normalizedName },
              });
            }

            return { id: tag.id };
          })
        );
      }

      // Update the media item
      const updated = await ctx.db.mediaItem.update({
        where: { id },
        data: {
          ...updateData,
          ...(tags !== undefined && {
            tags: {
              set: tagConnections,
            },
          }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
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

      return updated;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found",
        });
      }

      const mediaItemId = input;

      // Check if user owns the media item
      const existingItem = await ctx.db.mediaItem.findUnique({
        where: { id: mediaItemId },
        select: { creatorId: true },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media item not found",
        });
      }

      if (existingItem.creatorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own items",
        });
      }

      // Soft delete: set visibility to UNLISTED (or we could add a deletedAt field later)
      // For now, we'll set visibility to UNLISTED as a soft delete
      await ctx.db.mediaItem.update({
        where: { id: mediaItemId },
        data: {
          visibility: "UNLISTED",
        },
      });

      return { success: true };
    }),
});


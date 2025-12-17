import { initTRPC, TRPCError } from "@trpc/server";
import { createContext, type Context } from "./context";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

// Rate-limited mutation procedure
export const rateLimitedMutation = protectedProcedure.use(
  async ({ ctx, next, path, type }) => {
    // Only apply rate limiting to mutations
    if (type !== "mutation") {
      return next();
    }

    // Use user ID as identifier
    const identifier = ctx.user?.id || "anonymous";
    
    // Different limits for different mutation types
    let options;
    if (path?.includes("create") || path?.includes("upload")) {
      // Stricter limits for uploads/creates
      options = { maxRequests: 10, windowMs: 60 * 1000 }; // 10 per minute
    } else if (path?.includes("rate") || path?.includes("save")) {
      // Moderate limits for ratings/saves
      options = { maxRequests: 30, windowMs: 60 * 1000 }; // 30 per minute
    } else {
      // Default limits for other mutations
      options = { maxRequests: 20, windowMs: 60 * 1000 }; // 20 per minute
    }

    const result = rateLimit(identifier, options);

    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Please try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
      });
    }

    return next();
  }
);


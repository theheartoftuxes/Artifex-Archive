// tRPC router root
import { router } from "./init";
import { mediaRouter } from "@/server/trpc/routers/media";
import { adminRouter } from "@/server/trpc/routers/admin";
import { userRouter } from "@/server/trpc/routers/user";

export const appRouter = router({
  media: mediaRouter,
  admin: adminRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;


import { postRouter } from "~/server/api/routers/post";
import { router, publicProcedure, createCallerFactory } from "./trpc";
import { workbookRouter } from "./routers/workbook";
import { sheetRouter } from "./routers/sheet";
import { userRouter } from "./routers/user";
import { macroRouter } from "./routers/macro";
import { chartRouter } from "./routers/charts";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
  post: postRouter,
  workbook: workbookRouter,
  sheet: sheetRouter,
  user: userRouter,
  macro: macroRouter,
  chart: chartRouter
});

// export type definition of API

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */

export const createCaller = createCallerFactory(appRouter);


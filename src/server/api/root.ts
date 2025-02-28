import { postRouter } from "~/server/api/routers/post";
import { router,  createCallerFactory } from "./trpc";
import { workbookRouter } from "./routers/workbook";
import { sheetRouter } from "./routers/sheet";
import { userRouter } from "./routers/user";
import { macroRouter } from "./routers/macro";
import { chartRouter } from "./routers/charts";

export const appRouter = router({
  post: postRouter,
  workbook: workbookRouter,
  sheet: sheetRouter,
  user: userRouter,
  macro: macroRouter,
  chart: chartRouter
});


export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */

export const createCaller = createCallerFactory(appRouter);


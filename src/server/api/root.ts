import { postRouter } from "~/server/api/routers/post";
import { router,  createCallerFactory } from "./trpc";
import { workbookRouter } from "./routers/workbook";
import { sheetRouter } from "./routers/sheet";
import { userRouter } from "./routers/user";
import { customFunctionRouter } from "./routers/customFunctions";
import { chartRouter } from "./routers/charts";
import { macroRouter } from "./routers/macro";

export const appRouter = router({
  post: postRouter,
  workbook: workbookRouter,
  sheet: sheetRouter,
  user: userRouter,
  chart: chartRouter,
  customFunction: customFunctionRouter,
  macro: macroRouter
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


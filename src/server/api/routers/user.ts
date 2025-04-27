import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getData: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const userInfo = await ctx.db.user.findFirst({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        macros: true,
        workbooks: true,
        customFunctions: true
      },
    });
    return userInfo;
  }),
});

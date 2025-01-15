import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const workbookRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name } = input;
      const user = ctx.session.user;

      const workbook = await ctx.db.workbook.create({
        data: {
          name,
          authorId: user.id,
          sheets: {
            create: [
              {
                name: "Sheet 1",
                rows: Array.from({ length: 16 }, (_, rowIndex) => ({
                    rowNum: rowIndex + 1,
                    cells: Array.from({ length: 16 }, (_, colIndex) => ({
                      colNum: colIndex + 1,
                      value: null,
                      dataType: "TEXT",
                    })),
                  })),
              },
            ],
          },
        },
      });

      return workbook;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = ctx.session.user;

      const workbook = await ctx.db.workbook.findUnique({
        where: { id: input.id },
        include: {sheets: true}
      });

      if (!workbook || user.id != workbook.authorId) {
        return null
      }

      return workbook;
    }),
});

import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
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
                rowCount: 256, // Store row and column count
                colCount: 256,
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
        include: { sheets: {include: {charts: true}} },
      });

      if (!workbook || user.id !== workbook.authorId) {
        return null;
      }

      return workbook;
    }),

  getUserWorkbooks: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;

    return ctx.db.workbook.findMany({
      where: { authorId: user.id },
    });
  }),

  updateSheet: protectedProcedure
    .input(
      z.object({
        sheetId: z.string(),
        cells: z.array(
          z.object({
            rowNum: z.number(),
            colNum: z.number(),
            value: z.string().nullable(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sheetId, cells } = input;
      
      return ctx.db.sheet.update({
        where: { id: sheetId },
        data: {
          cells, 
        },
      });
    }),

  updateSheetSize: protectedProcedure
    .input(
      z.object({
        sheetId: z.string(),
        rowCount: z.number().min(1),
        colCount: z.number().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sheetId, rowCount, colCount } = input;

      return ctx.db.sheet.update({
        where: { id: sheetId },
        data: { rowCount, colCount },
      });
    }),
});


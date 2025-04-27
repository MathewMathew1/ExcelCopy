import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { SheetWithCells } from "~/types/WorkBook";

export const sheetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        workbookId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, workbookId } = input;
      const user = ctx.session.user;

      const workbook = await ctx.db.workbook.findFirst({
        where: { id: workbookId },
      });

      if (!workbook || workbook.authorId !== user.id)
        throw new Error("Unauthorized or workbook not found");

      const newSheet = await ctx.db.sheet.create({
        data: {
          name,
          workbookId,
          rowCount: 256,
          colCount: 256,
        },
      });

      const sheetWithCells: SheetWithCells = {
        ...newSheet,
        cells: [],
        charts: [],
      };
      return sheetWithCells;
    }),

  rename: protectedProcedure
    .input(
      z.object({
        sheetId: z.string(),
        newName: z.string().min(1, "Name is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { sheetId, newName } = input;
      const user = ctx.session.user;

      const sheet = await ctx.db.sheet.findFirst({
        where: { id: sheetId },
        include: { workbook: true },
      });

      if (!sheet || sheet.workbook.authorId !== user.id)
        throw new Error("Unauthorized or sheet not found");

      const updatedSheet = await ctx.db.sheet.update({
        where: { id: sheetId },
        data: { name: newName },
      });

      return updatedSheet;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        sheetId: z.string(),
        workbookId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { sheetId, workbookId } = input;
      const user = ctx.session.user;

      const workbook = await ctx.db.workbook.findFirst({
        where: { id: workbookId, authorId: user.id },
        include: { sheets: true },
      });

      if (!workbook) throw new Error("Unauthorized or workbook not found");

      await ctx.db.sheet.delete({ where: { id: sheetId } });

      return { sheetId };
    }),

  copy: protectedProcedure
    .input(
      z.object({
        sheetId: z.string(),
        workbookId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { sheetId, workbookId } = input;
      const user = ctx.session.user;

      const sheet = await ctx.db.sheet.findUnique({
        where: { id: sheetId },
        include: { workbook: true, charts: true },
      });
     
      if (!sheet || sheet.workbook.authorId !== user.id) {
        throw new Error("Unauthorized or sheet not found");
      }
    
      return await ctx.db.$transaction(async (prisma) => {
        const copiedSheet = await prisma.sheet.create({
          data: {
            name: `${sheet.name} (Copy)`,
            workbookId,
            rowCount: sheet.rowCount,
            colCount: sheet.colCount,
            cells: sheet.cells
          },
        });

        if (sheet.charts.length > 0) {
          await prisma.chart.createMany({
            data: sheet.charts.map((chart) => ({
              sheetId: copiedSheet.id,
              name: chart.name,
              type: chart.type,
              startRow: chart.startRow,
              startCol: chart.startCol,
              endRow: chart.endRow,
              endCol: chart.endCol,
              mode: chart.mode,
              anchorRow: chart.anchorRow,
              anchorCol: chart.anchorCol,
              width: chart.width,
              height: chart.height,
            })),
          });
        }

        const charts = sheet.charts.map((c) => {
          return { ...c, id: copiedSheet.id };
        });
       
        return { ...copiedSheet, charts };
      });
    }),
});

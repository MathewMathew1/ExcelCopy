import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { ChartMode, ChartType } from "@prisma/client";

export const chartRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        sheetId: z.string(),
        name: z.string(),
        type: z.nativeEnum(ChartType), // Define your chart types
        startRow: z.number(),
        startCol: z.number(),
        endRow: z.number(),
        endCol: z.number(),
        mode: z.nativeEnum(ChartMode), // COUNT occurrences or SUM values
        anchorRow: z.number(),
        anchorCol: z.number(),
        width: z.number(),
        height: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.chart.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        chartId: z.string(),
        name: z.string().optional(),
        type: z.nativeEnum(ChartType),
        startRow: z.number().optional(),
        startCol: z.number().optional(),
        endRow: z.number().optional(),
        endCol: z.number().optional(),
        mode: z.nativeEnum(ChartMode),
        anchorRow: z.number().optional(),
        anchorCol: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { chartId, ...updateData } = input; 

      return await ctx.db.chart.update({
        where: { id: chartId },
        data: updateData, 
      });
    }),


  delete: protectedProcedure
    .input(
      z.object({
        chartId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const chart = await ctx.db.chart.delete({
        where: { id: input.chartId },
      });
      return chart;
    }),
});

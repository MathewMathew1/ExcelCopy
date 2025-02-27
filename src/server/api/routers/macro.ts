import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { MacroArg } from "@prisma/client";
import { MacroArgSchema } from "~/types/Macro";

export const macroRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        code: z.string().min(1),
        args: z.array(MacroArgSchema)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const macro = await ctx.db.macro.create({
        data: {
          name: input.name,
          description: input.description,
          code: input.code,
          createdById: ctx.session.user.id,
          args: input.args
        },
      });
      return macro;
    }),
    getAll: protectedProcedure.query(async ({ctx}) => {
      const user = ctx.session.user;
      return await ctx.db.macro.findMany({
        where: {createdById: user.id},
        orderBy: { createdAt: "desc" },
      });
    }),
    delete: protectedProcedure
    .input(
      z.object({
        id: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.session.user
      const macro = await ctx.db.macro.delete({
        where: {
          id: input.id,
          createdById: user.id
        },
      });

      if(!macro) throw new Error("Unauthorized or macro not found");

      return macro.id
    }),
    edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        code: z.string().min(1),
        args: z.array(MacroArgSchema)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const macro = await ctx.db.macro.update({
        where: {id: input.id, createdById: ctx.session.user.id},
        data: {
          name: input.name,
          description: input.description,
          code: input.code,
          args: input.args
        },
      });

      if(!macro) throw new Error("Unauthorized or macro not found");
      
      return macro;
    }),
});
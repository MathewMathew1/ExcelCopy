import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Custom Zod validator for shortcut: must be either undefined or exactly 1 letter (a-z or A-Z)
const shortcutSchema = z
  .string()
  .max(1, "Shortcut must be exactly one character")
  .regex(/^[a-zA-Z]$/, "Shortcut must be a letter (A-Z)")
  .optional();

export const macroRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Macro name is required"),
        text: z.string().min(1, "Macro text is required"),
        shortcut: shortcutSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, text, shortcut } = input;
      const user = ctx.session.user;

      const newMacro = await ctx.db.macro.create({
        data: {
          name,
          text,
          shortcut,
          authorId: user.id,
        },
      });

      return newMacro;
    }),

  update: protectedProcedure
    .input(
      z.object({
        macroId: z.string(),
        name: z.string().min(1, "Macro name is required"),
        text: z.string().min(1, "Macro text is required"),
        shortcut: shortcutSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { macroId, name, text, shortcut } = input;
      const user = ctx.session.user;

      const macro = await ctx.db.macro.findFirst({
        where: { id: macroId, authorId: user.id },
      });

      if (!macro) throw new Error("Unauthorized or macro not found");

      const updatedMacro = await ctx.db.macro.update({
        where: { id: macroId },
        data: {
          name,
          text,
          shortcut,
        },
      });

      return updatedMacro;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        macroId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { macroId } = input;
      const user = ctx.session.user;

      const macro = await ctx.db.macro.findFirst({
        where: { id: macroId, authorId: user.id },
      });

      if (!macro) throw new Error("Unauthorized or macro not found");

      await ctx.db.macro.delete({
        where: { id: macroId },
      });

      return { macroId };
    }),
});


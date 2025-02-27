import { ArgType } from "@prisma/client";
import { z } from "zod";



export const MacroArgSchema = z.object({
  name: z.string().min(1, "Argument name is required"),        
  type: z.nativeEnum( ArgType ),
  description: z.string(),                         
});

export const CONVERTED_TYPE_ARGS = {
  [ArgType.STRING]: "string",
  [ArgType.NUMBER]: "number",
  [ArgType.BOOLEAN]: "boolean",
  [ArgType.DATE]: "date",
};



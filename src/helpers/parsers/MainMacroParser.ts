import { MacroField, macroFieldSchemas, MacroStep, MacroType, MacroTypeEnum } from "~/types/Macro";
import { parseArgs } from "./ParserArgs";
import { parseCellRef } from "./ParserCellRef";

export function parseMacroScript(script: string): MacroStep[] {
    const lines = script.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
    const steps: MacroStep[] = [];

    for (const line of lines) {
      const { command, args } = parseArgs(line);
      const type = command as MacroType;

      const schema = macroFieldSchemas[type];
  
      if (!schema) throw new Error(`Unknown macro type: ${type}`);
      
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const result: any = { type };

      for (const key in schema) {
        const field = schema[key as keyof typeof schema] as MacroField; // 👈 fix here
        if (!field) continue;
      
        const flag = field.flag ?? key;
      
        const raw = args[flag];
      
        if (key === "_") continue;

        switch (field.type) {
          
          case "cell":
            if (raw) {
              const { row, col } = parseCellRef(raw as string);
              if (key === "target") result[key] = { row, col };
              else {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                result[key] = { row, col }
              }
            }
            break;
          case "range":
          case "string":
            /* eslint-disable @typescript-eslint/no-explicit-any */
            if (raw) result[key] = raw;
            break;
          case "boolean":
            /* eslint-disable @typescript-eslint/no-explicit-any */
            result[key] = !!raw;
            break;
          case "number":
            /* eslint-disable @typescript-eslint/no-explicit-any */
            if (raw) result[key] = parseInt(raw as string, 10);
            break;
          case "enum":
            /* eslint-disable @typescript-eslint/no-explicit-any */
            if (raw && field.enumType) result[key] = field.enumType[raw as keyof typeof field.enumType];
            break;
        }
      
        if (field.required && result[key] == null) {
          throw new Error(`Missing required flag: -${flag} for ${type}`);
        }
      }
      
  
      steps.push(result as MacroStep);
    }

    return steps;
  }
  


  
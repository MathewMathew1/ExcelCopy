// helpers/macro.ts

import type { MacroStep, MacroHandlerDeps } from "~/types/Macro";
import { getMacroHandler } from "~/contexts/Macro/macroRegistery";

export const executeMacro = (
  steps: MacroStep[],
  deps: MacroHandlerDeps
) => {
  for (const step of steps) {
    const handler = getMacroHandler(step.type);
    
    if (!handler) {
      console.warn("Unknown macro type:", step.type);
      continue;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    handler(step as any, deps);
  }
};

  
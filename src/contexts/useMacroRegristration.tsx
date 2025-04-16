// hooks/useMacroRegistration.ts
import { useEffect, useState } from "react";
import { FormulaFunctions } from "~/helpers/formulasSheet";
import { CONVERTED_TYPE_ARGS } from "~/types/Macro";
import { LockdownManager } from "~/helpers/customFunctions";
import "ses";
import { useUser } from "./useUser";

export const useMacroRegistration = () => {
      const useUserData = useUser();
      const [loadedMacros, setLoadedMacros] = useState(false);

  useEffect(() => {
    const userData = useUserData.userData
    if (!userData) return;

    if (!LockdownManager.isLockdownApplied()) {
      lockdown();
      LockdownManager.applyLockdown();
    }

    userData.macros.forEach((macro) => {
      const argsConverted = macro.args.map((arg) => ({
        ...arg,
        type: CONVERTED_TYPE_ARGS[arg.type] || "number",
      }));

      FormulaFunctions.register(
        macro.name,
        (args) => {
          try {
            const c = new Compartment({
              Math: harden(Math),
              Number: harden(Number),
              parseInt: harden(parseInt),
              parseFloat: harden(parseFloat),
              console: harden(console),
            });
            const func = c.evaluate(`(${macro.code})`) as unknown;
            if (typeof func === "function") {
              const value: unknown =  (func as (...args: unknown[]) => unknown)(...args);
              return typeof value === "string" || typeof value === "number"
                ? value
                : "0";
            } else {
              return "ERROR: Invalid macro function";
            }
          } catch (e) {
            console.log(e);
            return "ERROR: Macro execution failed";
          }
        },
        {
          description: macro.description ?? "User-defined function",
          args: argsConverted,
        },
      );
    });
    setLoadedMacros(true)
  }, [useUserData.userData]);

  return {loadedMacros}
};

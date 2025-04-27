// hooks/useCustomFunctionRegistration.ts
import { useEffect, useState } from "react";
import { FormulaFunctions } from "~/helpers/formulasSheet";
import { LockdownManager } from "~/helpers/customFunctions";
import "ses";
import { useUser } from "./useUser";
import { CONVERTED_TYPE_ARGS } from "~/types/Macro";

export const useCustomFunctionRegistration = () => {
      const useUserData = useUser();
      const [loadedCustomFunctions, setLoadedCustomFunctions] = useState(false);

  useEffect(() => {
    const userData = useUserData.userData
    if (!userData) return;

    if (!LockdownManager.isLockdownApplied()) {
      lockdown();
      LockdownManager.applyLockdown();
    }

    userData.customFunctions.forEach((customFn) => {
      const argsConverted = customFn.args.map((arg) => ({
        ...arg,
        type: CONVERTED_TYPE_ARGS[arg.type] || "number",
      }));

      FormulaFunctions.register(
        customFn.name,
        (args) => {
          try {
            const c = new Compartment({
              Math: harden(Math),
              Number: harden(Number),
              parseInt: harden(parseInt),
              parseFloat: harden(parseFloat),
              console: harden(console),
            });
            const func = c.evaluate(`(${customFn.code})`) as unknown;
            if (typeof func === "function") {
              const value: unknown =  (func as (...args: unknown[]) => unknown)(...args);
              return typeof value === "string" || typeof value === "number"
                ? value
                : "0";
            } else {
              return "ERROR: Invalid customFn function";
            }
          } catch (e) {
            console.log(e);
            return "ERROR: customFn execution failed";
          }
        },
        {
          description: customFn.description ?? "User-defined function",
          args: argsConverted,
        },
      );
    });
    setLoadedCustomFunctions(true)
  }, [useUserData.userData]);

  return {loadedCustomFunctions}
};

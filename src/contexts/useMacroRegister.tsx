import { executeMacro } from "~/helpers/macro";
import { MacroStep } from "~/types/Macro";
import { useCellContext } from "./useCellContext";
import useMacroContext from "./useMacroContext";
import { parseMacroScript } from "~/helpers/parsers/MainMacroParser";
import { Chart } from "@prisma/client";
import { useSheet } from "~/types/WorkBook";
import { useUser } from "./useUser";
import { useCallback, useEffect } from "react";

const useMacroRegistration = ({cellCache, cellDependencies, saveChangesInChart, handleSort, computedCellData}:{
  cellCache: Record<string, string | number>,
  cellDependencies: Record<string, Set<string>>,
  saveChangesInChart: (chart: Chart) => Promise<void>,
  handleSort: ({ start, end, sortAscending, sheetId, }: {
    start: {
        row: number;
        col: number;
    };
    end: {
        row: number;
        col: number;
    };
    sortAscending: boolean;
    sheetId: string;
}) => void,
computedCellData: Record<string, string | number>}
) => {
  const workbook = useSheet();
  const sheetId = workbook.currentSheet.id;

  const {userData} = useUser()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       
      if (!userData?.macros || e.ctrlKey === false) return;
  
      const pressedKey = e.key.toUpperCase(); 
  
      const matchedMacro = userData.macros.find((macro) => {

        return macro.shortcut === pressedKey;
      });
   
      if (matchedMacro) {
        e.preventDefault(); 
        runMacroScript(matchedMacro.text);
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userData?.macros]);

  const macro = useMacroContext({
    cellCache,
    cellDependencies,
    handleSort,
    saveChangesInChart,
    computedCellData
  });

  const executionOfMacro = useCallback((macroSteps: MacroStep[]) => {
    console.log("In executionOfMacro, computedCellData:", computedCellData);
    executeMacro(macroSteps, {
      ...macro,
      sheetId,
      cellCache: cellCache,
      cellDependencies: cellDependencies,
      computedCellData: computedCellData,
    });
  }, [
    macro,
    sheetId,
    cellCache,
    cellDependencies,
    computedCellData,
  ]);

  const runMacroScript = useCallback((macroScript: string) => {
    const macroSteps = parseMacroScript(macroScript);
    executionOfMacro(macroSteps);
  }, [executionOfMacro, computedCellData]);

  return { runMacroScript };
};

export default useMacroRegistration;

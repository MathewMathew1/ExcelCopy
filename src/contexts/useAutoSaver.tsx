import { useEffect, useRef } from "react";
import type { CellData } from "~/types/Cell";
import type { SheetWithCells, WorkBookWithSheets } from "~/types/WorkBook";
import { useUpdateToast } from "./useToast";
import { severityColors } from "~/types/Toast";
import { api } from "~/trpc/react";
import { CellKey } from "./useMementoCells";

interface UseAutoSaveProps {
  currentSheetId: string | null;
  workbookSheets: SheetWithCells[];
  cellData: Record<string, Record<CellKey, CellData | null>>;
  workbook: WorkBookWithSheets
}

export function useAutoSave({
  currentSheetId,
  workbookSheets,
  cellData,
  workbook

}: UseAutoSaveProps) {
    const updateSheet = api.workbook.updateSheet.useMutation();

  const unsavedChangesRef = useRef<Record<string, boolean>>({});
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const updateToast = useUpdateToast();

  const markUnsaved = (sheetId: string) => {
    unsavedChangesRef.current = {
      ...unsavedChangesRef.current,
      [sheetId]: true,
    };
  };

  const handleAutoSave = async (sheetId: string) => {

    if (!unsavedChangesRef.current[sheetId]) return;
    
    const sheet = workbookSheets.find((s) => s.id === sheetId);
    if (!sheet) return;

    const updatedCells = Object.values(cellData)
      .filter((value) => value[sheetId])
      .map((value) => {return value.key!});
    try {
      await updateSheet.mutateAsync({ sheetId, cells: updatedCells });

      unsavedChangesRef.current[sheetId] = false;
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  useEffect(() => {

    if (!currentSheetId) return;
 
    const timer = saveTimers.current[currentSheetId];
    if (timer) clearTimeout(timer);

 
    const newTimer = setTimeout(() => {

      void saveAll();
    }, 3000);

    saveTimers.current[currentSheetId] = newTimer;

    return () => {
      clearTimeout(newTimer);
    };
  }, [cellData, currentSheetId]);


    const saveAll = async () => {
      const unsavedSheetIds = Object.keys(unsavedChangesRef.current).filter(
        (sheetId) => unsavedChangesRef.current[sheetId],
      );
  
      if (unsavedSheetIds.length === 0) {
        return;
      }
  
      try {
        await Promise.all(
          unsavedSheetIds.map(async (sheetId) => {
            await handleUpdateSheet(sheetId);
            unsavedChangesRef.current[sheetId] = false;
          }),
        );

      } catch (error) {
        console.error("Failed to save all sheets:", error);
        updateToast.addToast({
          toastText: "Failed to save some sheets. Please try again.",
          severity: severityColors.error,
        });
      }
    };

     const handleUpdateSheet = async (sheetId: string) => {
        const sheet = workbook?.sheets.find((s) => s.id === sheetId);
        clearTimeout(saveTimers.current[sheetId]);
    
        if (!sheet) return;
    
        const updatedCells = [];
  
        for (const key in cellData[sheetId]) {
          const value = cellData[sheetId][key];
       
          if (!value) continue;
    
          updatedCells.push(value);
        }
     
        try {
          await updateSheet.mutateAsync({ sheetId, cells: updatedCells });
        } catch (error) {
          console.error("Failed to update sheet:", error);
        }
      };

  return {
    markUnsaved,
    handleAutoSave,
    unsavedChangesRef,
    saveAll,
    handleUpdateSheet
  };
}

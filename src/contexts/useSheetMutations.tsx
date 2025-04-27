// useSheetMutations.ts
import { api } from "~/trpc/react";
import { severityColors } from "~/types/Toast";
import { useUpdateToast } from "~/contexts/useToast";
import type { SheetWithCells } from "~/types/WorkBook";
import { useState } from "react";
import type { CellData, CellDataMemento } from "./useMementoCells";

export const useSheetMutations = (
  workbook: { sheets: SheetWithCells[] },
  idOfProject: string,
  cellDataMemento: CellDataMemento,
) => {
  const updateToast = useUpdateToast();
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);

  const createSheetMutation = api.sheet.create.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Create sheet successfully",
        severity: severityColors.success,
      });
      workbook.sheets.push(data);
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to create Sheet",
        severity: severityColors.error,
      });
    },
  });

  const renameSheet = api.sheet.rename.useMutation({
    onSuccess: (updatedSheet) => {
      updateToast.addToast({
        toastText: "Renamed sheet successfully",
        severity: severityColors.success,
      });

      workbook.sheets = workbook.sheets.map((sheet) =>
        sheet.id === updatedSheet.id
          ? { ...sheet, name: updatedSheet.name }
          : sheet,
      );
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to rename sheet",
        severity: severityColors.error,
      });
    },
  });

  const updateSheetSize = api.workbook.updateSheetSize.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Resized sheet",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.id);

      if (sheet) {
        sheet.rowCount = data.rowCount;
        sheet.colCount = data.colCount;
      }
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to resize sheet",
        severity: severityColors.error,
      });
    },
  });

  const deleteSheet = api.sheet.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted sheet successfully",
        severity: severityColors.success,
      });
      workbook.sheets = workbook.sheets.filter(
        (sheet) => sheet.id !== data.sheetId,
      );
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to delete sheet",
        severity: severityColors.error,
      });
    },
  });

  const copySheet = api.sheet.copy.useMutation({
    onSuccess: (newSheet) => {
      updateToast.addToast({
        toastText: "Copied sheet successfully",
        severity: severityColors.success,
      });

      workbook.sheets = [...workbook.sheets, newSheet];
      const data: Record<string, CellData | null> = {};
      newSheet.cells.forEach((cell) => {
        const key = `${newSheet.id}-${cell.rowNum}-${cell.colNum}`;
        data[key] = {
          value: cell.value ?? "",
          colNum: cell.colNum,
          rowNum: cell.rowNum,
          sheetId: newSheet.id,
        };
      });

      cellDataMemento.addNewSheet(data, newSheet.id);
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to copy sheet",
        severity: severityColors.error,
      });
    },
  });

  const updateSheet = api.workbook.updateSheet.useMutation();

  const createSheet = async (sheetName: string) => {
    const newSheet = await createSheetMutation.mutateAsync({
      name: sheetName,
      workbookId: idOfProject,
    });

    if (newSheet) {
      setCurrentSheetId(newSheet.id);
    }
  };

  const changeSheetSize = async (newRows: number, newCols: number) => {
    if (!currentSheetId) return;

    try {
      await updateSheetSize.mutateAsync({
        sheetId: currentSheetId,
        colCount: newCols,
        rowCount: newRows,
      });

      updateToast.addToast({
        toastText: "Sheet size updated successfully",
        severity: severityColors.success,
      });
    } catch {
      updateToast.addToast({
        toastText: "Failed to update sheet size",
        severity: severityColors.error,
      });
    }
  };

  const deleteSheetFunc = async (sheetId: string) => {
    await deleteSheet.mutateAsync({
      sheetId,
      workbookId: idOfProject,
    });
  };

  const copySheetFunc = async (sheetId: string) => {
    try {
      const newSheet = await copySheet.mutateAsync({
        sheetId,
        workbookId: idOfProject,
      });
      setCurrentSheetId(newSheet.id);
    } catch (error) {
      console.error("Failed to copy sheet:", error);
    }
  };

  const renameSheetFunc = async (sheetId: string, sheetName: string) => {
    await renameSheet.mutateAsync({
      newName: sheetName,
      sheetId,
    });
  };

  return {
    createSheetMutation,
    renameSheet,
    deleteSheet,
    copySheet,
    updateSheetSize,
    updateSheet,
    changeSheetSize,
    createSheet,
    currentSheetId,
    setCurrentSheetId,
    deleteSheetFunc,
    copySheetFunc,
    renameSheetFunc,
  };
};

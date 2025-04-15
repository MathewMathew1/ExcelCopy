"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "~/trpc/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { DataType } from "@prisma/client";
import type { Chart } from "@prisma/client";
import { useUpdateToast } from "~/contexts/useToast";
import { severityColors } from "~/types/Toast";
import Sheet from "~/app/components/WorkBook/Sheet";
import type { SheetWithCells, WorkBookWithSheets } from "~/types/WorkBook";
import { useUser } from "~/contexts/useUser";
import { FormulaFunctions } from "~/helpers/formulasSheet";
import "ses";
import { CONVERTED_TYPE_ARGS } from "~/types/Macro";
import { LoadingSpinner } from "../LoadingSpinner";
import type { CellData } from "~/types/Cell";
import { LockdownManager } from "~/helpers/customFunctions";
import { CellDataMemento, useCellDataMemento } from "~/contexts/useMementoCells";

export interface SheetContextProps {
  currentSheet: SheetWithCells;
  cells: Record<string, CellData | null>;
  sheets: SheetWithCells[];
  workbookName: string;
  cellDataMemento: CellDataMemento
}

declare global {
  interface GlobalThis {
    lockdownApplied?: boolean;
  }
}

export interface WorkBookUpdateContextProps {
  handleUpdateSheet: (sheetId: string) => Promise<void>;
  handleCellChange: (
    sheetId: string,
    changes:
      | {
          rowNum: number;
          colNum: number;
          newValue: string | null;
        }
      | {
          rowNum: number;
          colNum: number;
          newValue: string | null;
        }[],
  ) => void;
  createSheet: (sheetName: string) => Promise<void>;
  setCurrentSheet: (sheetId: string) => void;
  deleteSheetFunc: (sheetId: string) => Promise<void>;
  copySheetFunc: (sheetId: string) => Promise<void>;
  renameSheetFunc: (sheetId: string, name: string) => Promise<void>;
  deleteMacroFunc: (macroId: string) => Promise<void>;
  saveAll: () => Promise<void>;
  changeSheetSize: (newRows: number, newCols: number) => Promise<void>;
  createChartFunc: (chart: Chart, sheetId: string) => Promise<void>;
  updateChartFunc: (chart: Chart) => Promise<void>;
  deleteChartFunc: (chartId: string) => Promise<void>;
  versionOfCharts: number;
}

const SheetContext = createContext<SheetContextProps>({} as SheetContextProps);
const WorkBookUpdateContext = createContext<WorkBookUpdateContextProps>(
  {} as WorkBookUpdateContextProps,
);

export function useUpdateWorkBook() {
  return useContext(WorkBookUpdateContext);
}

export function useSheet() {
  return useContext(SheetContext);
}

const Workbook = ({ workbook }: { workbook: WorkBookWithSheets }) => {
  const router = useRouter();
  const pathname = usePathname();
  const updateToast = useUpdateToast();
  const params = useParams<{ id: string }>();
  const idOfProject = params?.id ?? "1";
  const [loadedData, setLoadedData] = useState(false);
  const useUserData = useUser();
  const unsavedChangesRef = useRef<Record<string, boolean>>({});
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [versionOfCharts, setVersionOfCharts] = useState(1);
  const cellDataMemento = useCellDataMemento();

  const trpcUtils = api.useUtils();

  const updateSheet = api.workbook.updateSheet.useMutation();
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

  const createChart = api.chart.create.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Created chart",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.sheetId);
      setVersionOfCharts((prev) => prev + 1);
      sheet?.charts.push(data);
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to create chart",
        severity: severityColors.error,
      });
    },
  });

  const updateChart = api.chart.update.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Updated chart",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.sheetId);

      const index = sheet?.charts.findIndex((c) => c.id === data.id);
      if (index !== undefined) {
        sheet!.charts[index] = data;
        setVersionOfCharts((prev) => prev + 1);
      }
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to update chart",
        severity: severityColors.error,
      });
    },
  });

  const deleteChart = api.chart.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted chart",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.sheetId);

      const index = sheet?.charts.findIndex((c) => c.id === data.id);
      if (index !== undefined) {
        sheet?.charts.splice(index, 1);
        setVersionOfCharts((prev) => prev + 1);
      }
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to delete chart",
        severity: severityColors.error,
      });
    },
  });

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

  const deleteMacro = api.macro.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted macro successfully",
        severity: severityColors.success,
      });

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          macros: oldData.macros.filter((macro) => macro.id !== data),
        };
      });
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to delete macro",
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
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to copy sheet",
        severity: severityColors.error,
      });
    },
  });

  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      // eslint-disable-next-line
      const params = new URLSearchParams(searchParams!);
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    if (!workbook || !searchParams) return;

    const searchId = searchParams.get("sheet");
    const sheetFromUrl = workbook.sheets.find((sheet) => sheet.id === searchId);

    if (sheetFromUrl) {
      setCurrentSheetId(sheetFromUrl.id);
    } else {
      const firstSheet = workbook.sheets[0];
      if (firstSheet) {
        setCurrentSheetId(firstSheet.id);
        router.push(pathname + "?" + createQueryString("sheet", firstSheet.id));
      }
    }
  }, [
    workbook,
    searchParams,
    idOfProject,
    createQueryString,
    pathname,
    router,
  ]);

  useEffect(() => {
    if (currentSheetId) {
      router.push(pathname + "?" + createQueryString("sheet", currentSheetId));
    }
  }, [currentSheetId, createQueryString, pathname, router]);

  useEffect(() => {
    if (workbook && workbook.sheets.length > 0) {
      const initialData: Record<string, CellData | null> = {};
      workbook.sheets.forEach((sheet) => {
        sheet.cells.forEach((cell) => {
          initialData[`${sheet.id}-${cell.rowNum}-${cell.colNum}`] = {
            value: cell.value ?? "",
            colNum: cell.colNum,
            rowNum: cell.rowNum,
            sheetId: sheet.id,
          };
        });
      });
      cellDataMemento.setInitialData(initialData)
    }
  }, [workbook.id, workbook]);

  useEffect(() => {
    if (!useUserData.userData) return;

    if (LockdownManager.isLockdownApplied() === false) {
      lockdown();
      LockdownManager.applyLockdown();
    }

    useUserData.userData?.macros.forEach((macro) => {
      const argsConverted = macro.args.map((arg) => {
        return { ...arg, type: CONVERTED_TYPE_ARGS[arg.type] || "number" };
      });
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
    
              const value: unknown = (func as (...args: unknown[]) => unknown)(...args);
            
              if (typeof value === "string" || typeof value === "number") return value;
              
              return "0";
            } else {
              return "ERROR: Invalid macro function";
            }
          } catch(e) {
            console.log(e)
            return "ERROR: Macro execution failed";
          }
        },
        {
          description: macro.description ?? "User-defined function",
          args: argsConverted ?? [],
        },
      );
    });
    setLoadedData(true);
  }, [useUserData.userData?.macros, useUserData.userData]);

  useEffect(() => {
    const handleAutoSave = async (
      sheetId: string,
      latestCellData: Record<string, CellData | null>,
    ) => {
      if (!unsavedChangesRef.current[sheetId]) return;

      const sheet = workbook?.sheets.find((s) => s.id === sheetId);
      if (!sheet) return;

      const updatedCells = [];

      for (const key in latestCellData) {
        const value = latestCellData[key];
        if (!value || value.sheetId != sheetId) continue;
        const cell = { ...value, dataType: DataType.TEXT };

        updatedCells.push(cell);
      }

      try {
        await updateSheet.mutateAsync({ sheetId, cells: updatedCells });

        const updatedChanges = {
          ...unsavedChangesRef.current,
          [sheetId]: false,
        };
        unsavedChangesRef.current = updatedChanges;
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    };

    if (!currentSheetId) return;

    const currentTimer = saveTimers.current[currentSheetId];

    if (currentTimer) {
      clearTimeout(currentTimer);
    }

    const newTimer = setTimeout(() => {
      void handleAutoSave(currentSheetId, cellDataMemento.cellData);
    }, 3000);

    saveTimers.current[currentSheetId] = newTimer;

    return () => {
      clearTimeout(newTimer);
    };
  }, [cellDataMemento.cellData, currentSheetId, updateSheet, workbook.sheets]);

  const handleCellChange = (
    sheetId: string,
    changes:
      | { rowNum: number; colNum: number; newValue: string | null }
      | { rowNum: number; colNum: number; newValue: string | null }[],
  ) => {

    const enrichedChanges = Array.isArray(changes)
    ? changes.map((c) => ({ ...c, sheetId }))
    : { ...changes, sheetId };

    cellDataMemento.updateCellData(enrichedChanges)

    unsavedChangesRef.current = {
      ...unsavedChangesRef.current,
      [sheetId]: true,
    };
  };

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

      updateToast.addToast({
        toastText: "All unsaved sheets have been saved successfully!",
        severity: severityColors.success,
      });
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
    for (const key in cellDataMemento.cellData) {
      const value = cellDataMemento.cellData[key];
      if (!value || value.sheetId != sheetId) continue;
      const cell = { ...value, dataType: DataType.TEXT };

      updatedCells.push(cell);
    }

    try {
      await updateSheet.mutateAsync({ sheetId, cells: updatedCells });
      updateToast.addToast({
        toastText: "Sheet updated successfully!",
        severity: severityColors.success,
      });
    } catch (error) {
      console.error("Failed to update sheet:", error);
    }
  };

  const deleteMacroFunc = async (macroId: string) => {
    await deleteMacro.mutateAsync({
      id: macroId,
    });
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

  const createChartFunc = async (chart: Chart, sheetId: string) => {
    await createChart.mutateAsync({ ...chart, sheetId });
  };

  const updateChartFunc = async (chart: Chart) => {
    await updateChart.mutateAsync({ ...chart, chartId: chart.id });
  };

  const deleteChartFunc = async (chartId: string) => {
    await deleteChart.mutateAsync({ chartId });
  };

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

  return (
    <>
      <SheetContext.Provider
        value={{
          currentSheet:
            workbook.sheets.find((s) => s.id === currentSheetId) ??
            workbook.sheets[0]!,
          cells: cellDataMemento.cellData,
          sheets: workbook?.sheets ?? [],
          workbookName: workbook.name,
          cellDataMemento: cellDataMemento
        }}
      >
        <WorkBookUpdateContext.Provider
          value={{
            versionOfCharts,
            updateChartFunc,
            createChartFunc,
            changeSheetSize,
            saveAll,
            deleteMacroFunc,
            handleUpdateSheet,
            handleCellChange,
            createSheet,
            setCurrentSheet: setCurrentSheetId,
            deleteSheetFunc,
            renameSheetFunc,
            copySheetFunc,
            deleteChartFunc,
          }}
        >
          {loadedData ? (
            <Sheet key={"sheet"} />
          ) : (
            <div className="h-full w-full">
              <LoadingSpinner />
            </div>
          )}
        </WorkBookUpdateContext.Provider>
      </SheetContext.Provider>
    </>
  );
};

export default Workbook;

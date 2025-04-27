import type { Sheet, Workbook, Cell, Chart } from "@prisma/client";
import type { CellData } from "./Cell";
import type { CellDataMemento } from "~/contexts/useMementoCells";
import { createContext, useContext } from "react";
import { MacroFormData } from "~/app/components/WorkBook/Macro/CreateMacro";

export type SheetWithCells = Sheet & {cells: Cell[], charts: Chart[]}
export type WorkBookWithSheets = Workbook & {sheets: SheetWithCells[]}


export interface SheetContextProps {
  currentSheet: SheetWithCells;
  cells: Record<string, Record<string, CellData | null>>;
  sheets: SheetWithCells[];
  workbookName: string;
  cellDataMemento: CellDataMemento;
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
  deleteCustomFunctionFunc: (macroId: string) => Promise<void>;
  saveAll: () => Promise<void>;
  changeSheetSize: (newRows: number, newCols: number) => Promise<void>;
  createChartFunc: (chart: Chart, sheetId: string) => Promise<void>;
  updateChartFunc: (chart: Chart) => Promise<void>;
  deleteChartFunc: (chartId: string) => Promise<void>;
  versionOfCharts: number;
  createMacroFunc: (macro: MacroFormData) => Promise<void>
  updateMacroFunc: (macro: MacroFormData, macroId: string) => Promise<void>
  deleteMacroFunc: (macroId: string) => Promise<void>
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  addMacroStep: (step: string) => void;
  macroSteps: string;
}

export const SheetContext = createContext<SheetContextProps>({} as SheetContextProps);
export const WorkBookUpdateContext = createContext<WorkBookUpdateContextProps>(
  {} as WorkBookUpdateContextProps,
);

export function useUpdateWorkBook() {
  return useContext(WorkBookUpdateContext);
}

export function useSheet() {
  return useContext(SheetContext);
}
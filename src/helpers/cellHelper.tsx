import {
  SheetContextProps,
} from "~/app/components/WorkBook/Workbook";
import { evaluateFormula } from "./sheetHelper";
import { Cell, Sheet } from "@prisma/client";
import { SheetWithCells } from "~/types/WorkBook";
import { CellData, CellDataWithNull } from "~/types/Cell";

export const parseCellReferenceWithSheet = (
  cellRef: string,
  baseSheetId: string,
  sheetId?: string,
): [string, string] => {
  return cellRef.includes("!")
    ? (cellRef.split("!") as [string, string])
    : [sheetId || baseSheetId, cellRef];
};

export const findTargetSheet = (
  sheetIdentifier: string,
  workbook: SheetContextProps,
): SheetWithCells | undefined => {
  return (
    workbook.sheets.find(
      (s) => s.id.toLowerCase() === sheetIdentifier.toLowerCase(),
    ) || workbook.sheets.find((s) => s.name === sheetIdentifier)
  );
};

export const getCellIndexes = (
  simpleRef: string,
): { rowIndex: number; colIndex: number } => {
  const match = simpleRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error("Invalid cell reference format");

  const [, colRef, rowRef] = match;

  let colIndex = 0;
  for (let i = 0; i < colRef!.length; i++) {
    colIndex = colIndex * 26 + (colRef!.charCodeAt(i) - 65 + 1);
  }

  return {
    colIndex: colIndex - 1, // Convert to 0-based index
    rowIndex: parseInt(rowRef!, 10) - 1, // Convert to 0-based index
  };
};

export const getCellKey = (sheet: Sheet, row: number, col: number): string => {
  return `${sheet.id}-${row}-${col}`;
};

export const evaluateCellValue = (
  rawValue: string | null | undefined,
  targetSheet: Sheet,
  fullCellRef: string,
  visited: Set<string>,
  cellDependencies: Record<string, Set<string>>,
  getCellValue: (
    cellRef: string,
    visited?: Set<string>,
    sheetId?: string,
  ) => string | number,
): string | number => {
  if (typeof rawValue === "string" && rawValue.startsWith("=")) {
    const result = evaluateFormula(
      rawValue,
      (ref, sheetId) => {
        const normalizedRef = ref.includes("!")
          ? ref
          : `${targetSheet.id}!${ref}`;
        const upperRef = normalizedRef.toUpperCase();

        if (!cellDependencies[upperRef]) {
          cellDependencies[upperRef] = new Set();
        }
        cellDependencies[upperRef].add(fullCellRef);

        return getCellValue(upperRef, new Set(visited), sheetId);
      },
      targetSheet.id,
    );

    return isNaN(Number(result)) && typeof result === "string"
      ? result
      : Number(result) || 0;
  }

  return rawValue ?? "";
};

export const sortCells = ({
  start,
  end,
  sortAscending,
  sheetId,
  cellData,
  computedCellData
}: {
  start: { row: number; col: number };
  end: { row: number; col: number };
  sortAscending: boolean;
  sheetId: string;
  cellData: Record<string, CellData | null>;
  computedCellData: Record<string, string | number>
}): Record<string, CellDataWithNull | null> => {
  const updatedCells: Record<string, CellDataWithNull | null> = {}; 

  for (let col = start.col; col <= end.col; col++) {
    const columnCells: { key: string; value: string; row: number, computedValue: string|number }[] = [];

    for (let row = start.row; row <= end.row; row++) {
      const key = `${sheetId}-${row}-${col}`;
      if (cellData[key] && cellData[key]!.value.trim() !== "" && computedCellData[key]) {
        columnCells.push({ key, value: cellData[key]!.value, row, computedValue: computedCellData[key] });
      }
    }

    columnCells.sort((a, b) => {
      if (a.computedValue === b.computedValue) return 0;
      return sortAscending
        ? a.computedValue.toString().localeCompare(b.computedValue.toString(), undefined, { numeric: true })
        : b.computedValue.toString().localeCompare(a.computedValue.toString(), undefined, { numeric: true });
    });


    for (let i = 0; i <= end.row - start.row; i++) {
      const newRow = start.row + i;
      const newKey = `${sheetId}-${newRow}-${col}`;

      if (i < columnCells.length) {

        updatedCells[newKey] = {
          value: columnCells[i]!.value,
          colNum: col,
          rowNum: newRow,
        };
      } else {

        if (cellData[newKey] && cellData[newKey]!.value.trim() !== "") {
          updatedCells[newKey] = {
            value: null,
            colNum: col,
            rowNum: newRow,
          };
        }
      }
    }
  }
  console.log(updatedCells)
  return updatedCells;
};


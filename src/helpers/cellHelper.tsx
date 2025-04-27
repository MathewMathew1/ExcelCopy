import type { SheetContextProps } from "~/types/WorkBook";
import { evaluateFormula } from "./sheetHelper";
import type { Sheet } from "@prisma/client";
import type { SheetWithCells } from "~/types/WorkBook";
import type { CellData, CellDataWithNull } from "~/types/Cell";
import { getColumnLabel } from "./column";

export const parseCellReferenceWithSheet = (
  cellRef: string,
  baseSheetId: string,
  sheetId?: string,
): [string, string] => {
  return cellRef.includes("!")
    ? (cellRef.split("!") as [string, string])
    : [sheetId ?? baseSheetId, cellRef];
};

export const formatRange = (start: { row: number; col: number }, end: { row: number; col: number }) => {
  const startLabel = `${getColumnLabel(start.col)}${start.row + 1}`; // Adjust for 1-based row index
  const endLabel = `${getColumnLabel(end.col)}${end.row + 1}`;
  return `${startLabel}:${endLabel}`;
};

export const findTargetSheet = (
  sheetIdentifier: string,
  workbook: SheetContextProps,
): SheetWithCells | undefined => {
  return (
    workbook.sheets.find(
      (s) => s.id.toLowerCase() === sheetIdentifier.toLowerCase(),
    ) ?? workbook.sheets.find((s) => s.name === sheetIdentifier)
  );
};

export const getCellIndexes = (
  simpleRef: string,
): { rowIndex: number; colIndex: number } => {
  const regex = /^([A-Z]+)(\d+)$/
  const match = regex.exec(simpleRef);
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
      (ref, visited, sheetId) => {
        const normalizedRef = ref.includes("!")
          ? ref
          : `${targetSheet.id}!${ref}`;
        const upperRef = normalizedRef.toUpperCase();

        if (!cellDependencies[upperRef]) {
          cellDependencies[upperRef] = new Set();
        }
        cellDependencies[upperRef].add(fullCellRef);

        return getCellValue(upperRef, visited, sheetId);
      },
      targetSheet.id,
      visited
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
  cellData: Record<string, Record<string, CellData | null>>;
  computedCellData: Record<string, string | number>
}): Record<string, CellDataWithNull | null> => {
  const updatedCells: Record<string, CellDataWithNull | null> = {}; 

  for (let col = start.col; col <= end.col; col++) {
    const columnCells: { key: string; value: string; row: number, computedValue: string|number }[] = [];

    for (let row = start.row; row <= end.row; row++) {
      const key = `${sheetId}-${row}-${col}`;
      if (cellData[sheetId]![key] && cellData[sheetId]![key].value.trim() !== "" && computedCellData[key]) {
        columnCells.push({ key, value: cellData[sheetId]![key].value, row, computedValue: computedCellData[key] });
      }
    }

    columnCells.sort((a, b) => {
    
      console.log(Number(b.computedValue))
      return sortAscending
        ?  Number(a.computedValue) - Number(b.computedValue)
        :  Number(b.computedValue) - Number(a.computedValue);
    });
    console.log(columnCells)

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

        if (cellData[sheetId]![newKey] && cellData[sheetId]![newKey].value.trim() !== "") {
          updatedCells[newKey] = {
            value: null,
            colNum: col,
            rowNum: newRow,
          };
        }
      }
    }
  }

  return updatedCells;
};


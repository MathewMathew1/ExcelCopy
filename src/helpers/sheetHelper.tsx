import { SelectedArea } from "~/app/components/WorkBook/ColorfullStorage";
import { predefinedColors } from "./colorsTriangle";
import { FormulaFunctions } from "./formulasSheet";
import { Sheet, Workbook } from "@prisma/client";
import { WorkBookWithSheets } from "~/types/WorkBook";
import { SheetContextProps, WorkBookUpdateContextProps } from "~/app/components/WorkBook/Workbook";
import { getColumnLabel } from "./column";

export const evaluateFormula = (
  formula: string,
  getCellValue: (cellRef: string, sheetRef?: string) => string | number | null,
  sheetId: string,
): number | string => {
  try {
    if (formula.startsWith("=")) {
      let expression = formula.slice(1).trim().toUpperCase();

      const functionRegex = /([\w\d_]+)\(([^()]*)\)/g;

      let prevExpression;
      do {
        prevExpression = expression;

        expression = expression.replace(functionRegex, (match, func, argsString) => {
          const handler = FormulaFunctions.get(func);
          if (!handler) return match; // If function is not recognized, return original

          const args = parseArguments(argsString).flatMap((arg) => {
            arg = arg.trim();

            if (/^[A-Z]+\d+:[A-Z]+\d+$/.test(arg)) {
              return parseRange(arg, getCellValue);
            }

            if (/^[A-Z]+\d+$/.test(arg)) {
              return getCellValue(arg, sheetId) ?? 0;
            }

            if (/^-?\d+(\.\d+)?$/.test(arg)) {
              return parseFloat(arg);
            }

            return arg;
          });

          const result = handler(args, { getCellValue });

          return typeof result === 'number' ? result.toString() : match;
        });

      } while (expression !== prevExpression); 

      expression = expression.replace(/([\w\d]+)!([A-Z]+\d+)/g, (match, sheetRef, cellRef) => {
        const fullRef = `${sheetRef}!${cellRef}`;
        let value = getCellValue(fullRef, sheetId) || 0;

        if (!Number.isNaN(value) && typeof value === "string") {
          value = parseFloat(value);
        }
        return typeof value === "number" ? value.toString() : "0";
      });

      expression = expression.replace(/([A-Z]+\d+)/g, (match) => {
        let value = getCellValue(match, sheetId) || 0;

        if (!Number.isNaN(value) && typeof value === "string") {
          value = parseFloat(value);
        }

        return typeof value === "number" ? value.toString() : "0";
      });

      return Function(`"use strict"; return (${expression});`)();
    }

    return formula;
  } catch (err) {
    return "ERROR";
  }
};


const parseRange = (
  range: string,
  getCellValue: (cellRef: string, sheetRef?: string) => string | number | null,
): (string | number)[] => {
  const rangeMatch = range.match(/^([A-Z]\d+):([A-Z]\d+)$/);
  const rangeMatch2 = range.match(/([\w\d]+)!([A-Z]\d+):([A-Z]\d+)/);

  if (rangeMatch2) {
    return rangeFromOtherSheet(rangeMatch2, getCellValue);
  }

  if (rangeMatch) {
    return rangeFromSameSheet(rangeMatch, getCellValue);
  }

  return [];
};

const rangeFromSameSheet = (
  rangeMatch: RegExpMatchArray,
  getCellValue: (cellRef: string, sheetRef?: string) => string | number | null,
) => {
  const [, start, end] = rangeMatch!;

  if (!start || !end) return [];

  const startCol = start.charCodeAt(0) - 65; // A=0, B=1, etc.
  const startRow = parseInt(start.slice(1), 10) - 1;
  const endCol = end.charCodeAt(0) - 65;
  const endRow = parseInt(end.slice(1), 10) - 1;

  const values: (string | number)[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellRef = `${getColumnLabel(col)}${row + 1}`;
      let cellValue = getCellValue(cellRef);

      if (cellValue == null) continue;

      if (!isNaN(Number(cellValue)) && typeof cellValue === "string") {
        cellValue = Number(cellValue); // Convert to number
      }

      values.push(cellValue);
    }
  }

  return values;
};

const rangeFromOtherSheet = (
  rangeMatch: RegExpMatchArray,
  getCellValue: (cellRef: string, sheetRef?: string) => string | number | null,
) => {
  const start = rangeMatch[2];
  const sheetRef = rangeMatch[1];
  const end = rangeMatch[3];

  if (!start || !end || !sheetRef) return [];

  const startCol = start.charCodeAt(0) - 65;
  const startRow = parseInt(start.slice(1), 10) - 1;
  const endCol = end.charCodeAt(0) - 65;
  const endRow = parseInt(end.slice(1), 10) - 1;

  const values: (string | number)[] = [];

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellRef = `${getColumnLabel(col)}${row + 1}`;
      const fullRef = `${sheetRef}!${cellRef}`;

      let cellValue = getCellValue(fullRef, sheetRef);

      if (cellValue == null) continue;

      if (!isNaN(Number(cellValue)) && typeof cellValue === "string") {
        cellValue = Number(cellValue);
      }

      values.push(cellValue);
    }
  }

  return values;
};

const columnLetterToIndex = (col: string) => {
  return col.toUpperCase().charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
};

export const parseCellReference = (cellRef: string) => {
  const match = cellRef.match(/([A-Z]+)(\d+)/);

  if (!match) return null;

  const [, colRef, rowRef] = match;
  const colNum = colRef!
    .split("")
    .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 65 + 1), 0);
  const rowNum = parseInt(rowRef!, 10);

  return { colNum, rowNum };
};

// Helpers for cell reference conversions
const getColumnLetter = (colNum: number): string => {
  colNum = colNum + 1
  let letter = "";
  while (colNum > 0) {
    colNum--;
    letter = getColumnLabel((colNum % 26)) + letter;
    colNum = Math.floor(colNum / 26);
  }
  return letter;
};

export const normalizeCellRef = (ref: string, sheetId: string) => {
  return ref.includes("!")
    ? ref.toUpperCase()
    : `${sheetId}!${ref}`.toUpperCase();
};

// Dependency Management
export const addCellDependency = (
  cellDependencies: Record<string, Set<string>>,
  ref: string,
  dependentCell: string,
) => {
  if (!cellDependencies[ref]) {
    cellDependencies[ref] = new Set();
  }
  cellDependencies[ref].add(dependentCell);
};

export const clearCache = (
  cellKey: string,
  cellCache: Record<string, string | number>,
  cellDependencies: Record<string, Set<string>>,
) => {
  cellKey = cellKey.toUpperCase();
  delete cellCache[cellKey];
  if (cellDependencies[cellKey]) {
    cellDependencies[cellKey]!.forEach((dep) =>{
      if(dep !== cellKey){
        clearCache(dep, cellCache, cellDependencies)
      }
      }
    );
  }
};

export const handleCellChange = (
  sheetId: string,
  changes:
    | { rowNum: number; colNum: number; newValue: string|null } // Single update
    | { rowNum: number; colNum: number; newValue: string|null }[], // Multiple updates
  workbook: any,
  updateWorkBook: WorkBookUpdateContextProps,
  cellCache: Record<string, string | number>,
  cellDependencies: Record<string, Set<string>>,
) => {
  if (!Array.isArray(changes)) {
    changes = [changes]; // Convert single update to an array
  }

  const formattedChanges = changes



  updateWorkBook.handleCellChange(sheetId, changes);
  formattedChanges.forEach(({ rowNum, colNum}) => {
    
    const cellKey =
      `${sheetId}!${getColumnLetter(colNum)}${rowNum + 1}`.toUpperCase();

    clearCache(cellKey, cellCache, cellDependencies);
  });
};


export const findSheetByName = (
  name: string,
  workbook: SheetContextProps,
): Sheet | undefined => {
  return (
    workbook.sheets.find((s) => s.name.toLowerCase() === name.toLowerCase()) ||
    workbook.sheets[0]
  );
};

export const extractSelectedAreas = (
  cellValue: string,
  defaultSheet: Sheet,
  workbook: SheetContextProps,
): SelectedArea[] => {
  const rangePattern = /(?:(\w+)!)*([A-Z]+[0-9]+)(?::([A-Z]+[0-9]+))?/g;
  const matches = [...cellValue.toUpperCase().matchAll(rangePattern)];

  return matches
    .map((match, index) => {
      const sheetName = match[1] || defaultSheet.name;
      const startCell = match[2];
      const endCell = match[3];

      const start = parseCellReference(startCell!);
      const end = endCell ? parseCellReference(endCell) : start;

      if (!start || !end) return null;

      const topLeft = {
        rowNum: Math.min(start.rowNum, end.rowNum),
        colNum: Math.min(start.colNum, end.colNum),
      };
      const bottomRight = {
        rowNum: Math.max(start.rowNum, end.rowNum),
        colNum: Math.max(start.colNum, end.colNum),
      };

      const sheetReferenced = findSheetByName(sheetName, workbook);

      return {
        sheet: sheetReferenced,
        start: topLeft,
        area: endCell
          ? {
              sizeX: bottomRight.colNum - topLeft.colNum + 1,
              sizeY: bottomRight.rowNum - topLeft.rowNum + 1,
            }
          : undefined,
        borderColor:
          predefinedColors[index % predefinedColors.length]!.borderColor,
        backgroundColor:
          predefinedColors[index % predefinedColors.length]!.backgroundColor,
      };
    })
    .filter(Boolean) as SelectedArea[];
};

const parseArguments = (argsString: string): string[] => {
  const args: string[] = [];
  let currentArg = "";
  let insideQuotes = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (char === `"`) {
      insideQuotes = !insideQuotes; // Toggle quote mode
    }

    if (char === ";" && !insideQuotes) {
      // Split only when not inside quotes
      args.push(currentArg.trim());
      currentArg = "";
    } else {
      currentArg += char;
    }
  }

  if (currentArg) {
    args.push(currentArg.trim());
  }

  return args;
};


export const safeEvaluate = (expression: string): number => {
  try {
    // Ensure the expression only contains numbers, operators, and spaces
    if (/^[\d+\-*/().\s]+$/.test(expression)) {
      // Evaluate the expression using the Function constructor
      return new Function(`return ${expression}`)();
    } else {
      // Invalid characters detected
      return NaN;
    }
  } catch (error) {
    return NaN;
  }
};

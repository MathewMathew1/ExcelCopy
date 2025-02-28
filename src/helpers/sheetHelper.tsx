import type { SelectedArea } from "~/app/components/WorkBook/ColorfullStorage";
import { predefinedColors } from "./colorsTriangle";
import { FormulaFunctions } from "./formulasSheet";
import type { Sheet} from "@prisma/client";
import type { SheetContextProps, WorkBookUpdateContextProps } from "~/app/components/WorkBook/Workbook";
import { getColumnLabel } from "./column";
import { evaluate } from "mathjs";

export const evaluateFormula = (
  formula: string,
  getCellValue: (cellRef: string, visited: Set<string>, sheetRef?: string) => string | number | null,
  sheetId: string,
  visited: Set<string>
): number | string => {

    if (formula.startsWith("=")) {
      let expression = formula.slice(1).trim().toUpperCase();

      const functionRegex = /([\w\d_]+)\(([^()]*)\)/g;

      let prevExpression;
      do {
        prevExpression = expression;

        expression = expression.replace(functionRegex, (match, func: string, argsString: string) => {
          const handler = FormulaFunctions.get(func);
          if (!handler) return match; 

          const args = parseArguments(argsString).flatMap((arg) => {
            arg = arg.trim();

            if (/^[A-Z]+\d+:[A-Z]+\d+$/.test(arg)) {
              return parseRange(arg, (cellRef)=>getCellValue(cellRef, visited, sheetId));
            }

            if (/^[A-Z]+\d+$/.test(arg)) {
              return getCellValue(arg, visited, sheetId) ?? 0;
            }

            if (/^-?\d+(\.\d+)?$/.test(arg)) {
              return parseFloat(arg);
            }

            return arg;
          });
     
          const result = handler(args, { getCellValue: (cellRef)=>getCellValue(cellRef, visited, sheetId) });
          
          return typeof result === 'number' ? result.toString() : result;
        });
   
      } while (expression !== prevExpression); 

      expression = expression.replace(/([\w\d]+)!([A-Z]+\d+)/g, (match, sheetRef, cellRef) => {
        const fullRef = `${sheetRef}!${cellRef}`;
        let value = getCellValue(fullRef, visited, sheetId) ?? 0;

        if (!Number.isNaN(value) && typeof value === "string") {
          value = parseFloat(value);
        }
        return typeof value === "number" ? value.toString() : "0";
      });

      expression = expression.replace(/([A-Z]+\d+)/g, (match) => {
        let value = getCellValue(match, visited, sheetId ) ?? 0;

        if (!Number.isNaN(value) && typeof value === "string") {
          value = parseFloat(value);
        }

        return typeof value === "number" ? value.toString() : "0";
      });

      let value: string | number = expression;
      try {
        value = Number(evaluate(expression)); 
      } catch {
        value = expression;
      }

      return value;
    }

    return formula;

};



const parseRange = (
  range: string,
  getCellValue: (cellRef: string, sheetRef?: string) => string | number | null,
): (string | number)[] => {
  const regex = /^([A-Z]\d+):([A-Z]\d+)$/;
  const regex2  = /([\w\d]+)!([A-Z]\d+):([A-Z]\d+)/
  const rangeMatch = regex.exec(range)
  const rangeMatch2 = regex2.exec(range);

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
  const [, start, end] = rangeMatch

  if (!start || !end) return [];

  const startCol = start.charCodeAt(0) - 65; 
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
        cellValue = Number(cellValue); 
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


export const parseCellReference = (cellRef: string) => {
  const regex = /([A-Z]+)(\d+)/;
  const match = regex.exec(cellRef);

  if (!match) return null;

  const [, colRef, rowRef] = match;
  const colNum = colRef!
    .split("")
    .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 65 + 1), 0);
  const rowNum = parseInt(rowRef!, 10);

  return { colNum, rowNum };
};

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
  visited: Set<string> = new Set()
) => {
  cellKey = cellKey.toUpperCase();

  if (visited.has(cellKey)) {
    return;
  }

  visited.add(cellKey);

  delete cellCache[cellKey];

  if (cellDependencies[cellKey]) {
    cellDependencies[cellKey]!.forEach((dep) => {
      if (dep !== cellKey) {
        clearCache(dep, cellCache, cellDependencies, visited); 
      }
    });
  }
};


export const handleCellChange = (
  sheetId: string,
  changes:
    | { rowNum: number; colNum: number; newValue: string|null } 
    | { rowNum: number; colNum: number; newValue: string|null }[],
  updateWorkBook: WorkBookUpdateContextProps,
  cellCache: Record<string, string | number>,
  cellDependencies: Record<string, Set<string>>,
) => {
  if (!Array.isArray(changes)) {
    changes = [changes]; 
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
    workbook.sheets.find((s) => s.name.toLowerCase() === name.toLowerCase()) ??
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
      const sheetName = match[1] ?? defaultSheet.name;
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

  for (const char of argsString) {

    if (char === `"`) {
      insideQuotes = !insideQuotes; 
    }

    if (char === ";" && !insideQuotes) {
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


export const safeEvaluate = (
  expression: string,
  getCellValue: (cellRef: string, sheetRef?: string) => string | number | null
): number => {
  try {
    const safeExpression = expression.replace(/([A-Z]\d+)/g, (match) => {
      const value = getCellValue(match);
      return typeof value === "number" ? value.toString() : value ?? "0"; 
    });

    if (/^[\d+\-*/().\s]+$/.test(safeExpression)) {
      return Number(evaluate(safeExpression)); 
    } else {
      return NaN;
    }
  } catch (e) {
    console.log("Error evaluating expression:", e);
    return NaN;
  }
};

import { Sheet, Workbook, Cell, Chart } from "@prisma/client";

export type SheetWithCells = Sheet & {cells: Cell[], charts: Chart[]}
export type WorkBookWithSheets = Workbook & {sheets: SheetWithCells[]}
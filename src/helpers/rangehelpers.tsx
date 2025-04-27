// helpers/rangeHelper.ts

import { useState } from "react";
import { getCellIndexes } from "./cellHelper";

export const getStartEndEndFromRange = (range: string) => {
  const [start, end] = range.split(":");
  if (!start || !end) return [];

  const startCells = parse(start);
  const endCells = parse(end);

  return [startCells, endCells]
}

const parse = (ref: string) => {
  return getCellIndexes(ref);
};

export const getCellRangeValues = (
  range: string,
  sheetId: string,
  computedCellData: Record<string, string | number>,
): number[] => {

  const [startCells, endCells] = getStartEndEndFromRange(range);

  if(!startCells || !endCells) return []
  
  const values: number[] = [];

  for (let row = startCells.rowIndex; row <= endCells.rowIndex; row++) {
    for (let col = startCells.colIndex; col <= endCells.colIndex; col++) {
      const key = `${sheetId}-${row}-${col}`;
      if (!computedCellData[key]) {
        values.push(0);
        continue;
      }

      values.push(Number(computedCellData[key]) || 0);
    }
  }

  return values;
};

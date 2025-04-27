import { getColumnLabel } from "./column";

export const updateFormulaReferences = (
  formula: string,
  rowOffset: number,
  colOffset: number,
): string => {
  const cellReferencePattern = /([A-Z]+)(\d+)/g;

  return formula.replace(cellReferencePattern, (match, col: string, row: string) => {
    const newCol = shiftColumn(col, colOffset);
    const newRow = parseInt(row) + rowOffset;
    return `${newCol}${newRow}`;
  });
};

const shiftColumn = (col: string, offset: number): string => {
  let colNum = 0;

  for (let i = 0; i < col.length; i++) {
    colNum = colNum * 26 + (col.charCodeAt(i) - 65 + 1);
  }

  colNum += offset;
  let newCol = "";
  while (colNum > 0) {
    colNum--;
    newCol = getColumnLabel((colNum % 26) + 65) + newCol;
    colNum = Math.floor(colNum / 26);
  }

  return newCol;
};

export const calculateDraggedCells = (
  start: { rowNum: number; colNum: number },
  end: { rowNum: number; colNum: number },
) => {
  const cells = [];
  const rowStart = Math.min(start.rowNum, end.rowNum);
  const rowEnd = Math.max(start.rowNum, end.rowNum);
  const colStart = Math.min(start.colNum, end.colNum);
  const colEnd = Math.max(start.colNum, end.colNum);

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      cells.push({ rowNum: row, colNum: col });
    }
  }

  return cells;
};

export const updateFormulaForDraggedCell = (
  startRow: number,
  startCol: number,
  targetRow: number,
  targetCol: number,
  formula: string,
) => {
  const rowOffset = targetRow - startRow;
  const colOffset = targetCol - startCol;

  const colToNum = (col: string) => {
    return col.split('').reduce((acc, char) => {
      return acc * 26 + (char.charCodeAt(0) - 64);
    }, 0);
  };


  const numToCol = (num: number) => {
    let col = '';
    while (num > 0) {
      const remainder = (num - 1) % 26;
      col = getColumnLabel(65 + remainder) + col;
      num = Math.floor((num - 1) / 26);
    }
    return col;
  };

  const updatedFormula = formula.replace(/([A-Z]+)(\d+)/g, (_, colRef: string, rowRef: string) => {
    const newColNum = colToNum(colRef) + colOffset;
    const newRowNum = parseInt(rowRef, 10) + rowOffset;
    const newColRef = numToCol(newColNum);
    return `${newColRef}${newRowNum}`;
  });
 
  return updatedFormula;
};


import React from "react";
import Cell from "./Cell";
import { useSheet } from "~/types/WorkBook"; 
import type { Sheet } from "@prisma/client";
import type { CurrentCell } from "~/types/Cell";


export const ListCell = ({
  additionalData,
  columnIndex,
  rowIndex,
  style,
}: {
  additionalData: {
    sheet: Sheet;
    currentCell: CurrentCell|null;
    computedCellData: Record<string, string | number>;
  };
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}) => {
  const { sheet, currentCell, computedCellData } = additionalData;
  const workbook = useSheet();

  const cellKey = `${sheet.id}-${rowIndex}-${columnIndex}`;
  
  const sheetValues = workbook.cells[sheet.id]
  const currentValue = sheetValues? sheetValues[cellKey]?.value ?? "" : ""
  const displayValue = computedCellData[cellKey] ?? "";

 
  const isEditing =
    currentCell?.rowNum === rowIndex &&
    currentCell?.colNum === columnIndex &&
    currentCell.isCurrentlySelected &&
    currentCell.sheet === sheet.id;

  return (
    <MemoizedCell
      style={style}
      key={cellKey}
      rowNum={rowIndex}
      colNum={columnIndex}
      value={isEditing ? currentCell.value : currentValue}
      displayValue={displayValue}
      isEditing={isEditing}
    />
  );
};

const areEqual = (prevProps: any, nextProps: any) => {

  return (
    prevProps.columnIndex === nextProps.columnIndex &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.style === nextProps.style &&
    prevProps.additionalData.sheet.id === nextProps.additionalData.sheet.id &&
    prevProps.additionalData.currentCell === nextProps.additionalData.currentCell &&
    prevProps.additionalData.computedCellData === nextProps.additionalData.computedCellData
  );
};

export const MemoizedListCell2 = React.memo(ListCell, areEqual);

const MemoizedCell = React.memo(Cell, (prevProps, nextProps) => {

  const valueChanged =
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.value === nextProps.value &&
    prevProps.displayValue === nextProps.displayValue &&
    prevProps.style === nextProps.style

  return valueChanged;
});

export default ListCell;

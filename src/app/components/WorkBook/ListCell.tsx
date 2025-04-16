import React from "react";
import Cell from "./Cell";
import { useSheet } from "~/types/WorkBook"; 
import type { Sheet } from "@prisma/client";
import type { CurrentCell } from "~/types/Cell";

const ListCell = ({
  data,
  columnIndex,
  rowIndex,
  style,
}: {
  data: {
    sheet: Sheet;
    currentCell: CurrentCell|null;
    computedCellData: Record<string, string | number>;
  };
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}) => {
  const { sheet, currentCell, computedCellData } = data;
  const workbook = useSheet();

  const cellKey = `${sheet.id}-${rowIndex}-${columnIndex}`;
  
  const currentValue = workbook.cells[cellKey]?.value ?? "";
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

const MemoizedCell = React.memo(Cell, (prevProps, nextProps) => {

  const valueChanged =
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.value === nextProps.value &&
    prevProps.displayValue === nextProps.displayValue &&
    prevProps.style === nextProps.style

  return valueChanged;
});

export default ListCell;

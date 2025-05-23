import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { useUpdateWorkBook, useSheet} from "~/types/WorkBook";
import { updateFormulaForDraggedCell } from "~/helpers/formulaHelper";
import { getColumnLabel } from "~/helpers/column";
import type { CurrentCell } from "~/types/Cell";

import type { Dragging } from "~/types/Dragging";

type UseFormulaManagementProps = {
  currentCell: CurrentCell | null;
  cellCache: React.MutableRefObject<Record<string, string | number>>;
  cellDependencies: React.MutableRefObject<Record<string, Set<string>>>;
  mainInputRef: RefObject<HTMLInputElement>;
  inputRef: RefObject<HTMLInputElement>;
  saveChangeInCell: (rowNum: number, colNum: number, newValue: string) => void
};

const useFormulaManagement = ({
  currentCell,
  cellCache,
  cellDependencies,
  inputRef,
  mainInputRef,
  saveChangeInCell
}: UseFormulaManagementProps) => {
  const updateWorkBook = useUpdateWorkBook();
  const workbook = useSheet();
  const [dragHandler, setDragHandler] = useState<null | {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>(null);
  const [draggedFormula, setDraggedFormula] = useState<null | {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>(null);
  const [dragging, setDragging] = useState<Dragging>({ start: null, end: null });
  const [isDraggingFormula, setIsDraggingFormula] = useState(true);

  const sheet = workbook.currentSheet;

  const handleDragFormula = (targetRow: number, targetCol: number) => {
    if (!currentCell || !draggedFormula) return;

    const { startRow, startCol, endRow, endCol } = draggedFormula;

    const selectionHeight = endRow - startRow + 1;
    const selectionWidth = endCol - startCol + 1;

    const totalRowOffset = targetRow - endRow;
    const totalColOffset = targetCol - endCol;

    const numRepeatsRows = Math.ceil(
      (totalRowOffset + selectionHeight) / selectionHeight,
    );
    const numRepeatsCols = Math.ceil(
      (totalColOffset + selectionWidth) / selectionWidth,
    );

    for (let repeatRow = 0; repeatRow < numRepeatsRows; repeatRow++) {
      for (let repeatCol = 0; repeatCol < numRepeatsCols; repeatCol++) {
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const targetRowPos = row + repeatRow * selectionHeight;
            const targetColPos = col + repeatCol * selectionWidth;

            if (targetRowPos > targetRow || targetColPos > targetCol) continue;

            const cellKey = `${sheet.id}-${row}-${col}`;
            const currentValue = workbook.cells[sheet.id]![cellKey] ?? "";

            if (!currentValue) continue;

            const updatedFormula = updateFormulaForDraggedCell(
              row,
              col,
              targetRowPos,
              targetColPos,
              currentValue.value,
            );

            saveChangeInCell(
                targetRowPos,
                targetColPos,
                updatedFormula,
            );

            console.log(
              `Updated cell ${getColumnLabel(targetColPos - 1)}${targetRowPos} with formula: ${updatedFormula}`,
            );
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!currentCell || currentCell.isCurrentlySelected) {
      setDragHandler(null);
    } else {
      setDragHandler({
        startCol: currentCell.colNum,
        startRow: currentCell.rowNum,
        endRow: currentCell.rowNum,
        endCol: currentCell.colNum,
      });
    }
  }, [currentCell]);

  const setupDragging = (rowNum: number, colNum: number) => {
    const activeInput =
      document.activeElement === inputRef.current
        ? inputRef.current
        : document.activeElement === mainInputRef.current
          ? mainInputRef.current
          : null;
    if (!activeInput) return;

    const cursorPosition = activeInput.selectionStart ?? 0;

    if (currentCell?.value[cursorPosition - 1] === "(") {
      setDragging({ start: { rowNum, colNum }, end: null });
    }
  };

  return {
    handleDragFormula,
    draggedFormula,
    setDraggedFormula,
    setDragHandler,
    dragHandler,
    dragging,
    isDraggingFormula,
    setIsDraggingFormula,
    setDragging,
    setupDragging
  };
};

export default useFormulaManagement;

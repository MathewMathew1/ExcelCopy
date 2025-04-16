import { RefObject, useCallback, useEffect, useState } from "react";
import { useUpdateWorkBook, useSheet, SheetWithCells } from "~/types/WorkBook";
import { updateFormulaForDraggedCell } from "~/helpers/formulaHelper";
import { getCellKey } from "~/helpers/cellHelper";
import { getColumnLabel } from "~/helpers/column";
import { CurrentCell } from "~/types/Cell";
import { handleCellChange } from "~/helpers/sheetHelper";
import { Dragging } from "~/types/Dragging";

type UseFormulaManagementProps = {
  currentCell: CurrentCell | null;
  cellCache: React.MutableRefObject<Record<string, string | number>>;
  cellDependencies: React.MutableRefObject<Record<string, Set<string>>>;
  mainInputRef: RefObject<HTMLInputElement>;
  inputRef: RefObject<HTMLInputElement>;
};

const useFormulaManagement = ({
  currentCell,
  cellCache,
  cellDependencies,
  inputRef,
  mainInputRef
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
            const currentValue = workbook.cells[cellKey] ?? "";

            if (!currentValue) continue;

            const updatedFormula = updateFormulaForDraggedCell(
              row,
              col,
              targetRowPos,
              targetColPos,
              currentValue.value,
            );

            handleCellChange(
              sheet.id,
              {
                rowNum: targetRowPos,
                colNum: targetColPos,
                newValue: updatedFormula,
              },
              updateWorkBook,
              cellCache.current,
              cellDependencies.current,
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

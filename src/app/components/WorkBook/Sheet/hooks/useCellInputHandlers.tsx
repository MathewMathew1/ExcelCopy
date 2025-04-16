import { useCallback } from "react";
import type {MutableRefObject, RefObject} from "react"
import type { CurrentCell } from "~/types/Cell";
import { handleCellChange } from "~/helpers/sheetHelper";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";
import type { Dragging } from "~/types/Dragging";
import { getColumnLabel } from "~/helpers/column";
import type { EventManager, EventMap} from "~/app/managers/EventManager";


type CellInputHandlerProps = {
  currentCell: CurrentCell | null;
  setCurrentCell: React.Dispatch<React.SetStateAction<CurrentCell | null>>;
  mainInputRef: RefObject<HTMLInputElement>;
  dragging: Dragging;
  cellCache: MutableRefObject<Record<string, string | number>>
  cellDependencies: MutableRefObject<Record<string, Set<string>>>
  setCurrentCellFunc: (rowNum: number, colNum: number, setSelect?: boolean) => void
  eventManager: EventManager<EventMap>
  inputRef: RefObject<HTMLInputElement>;
  handleDragFormula: (targetRow: number, targetCol: number) => void
};

const useCellInputHandlers = ({
  currentCell,
  setCurrentCell,
  mainInputRef,
  dragging,
  cellCache,
  cellDependencies,
  setCurrentCellFunc,
  eventManager,
  inputRef,
  handleDragFormula
}: CellInputHandlerProps) => {
  const workbook = useSheet();
  const updateWorkBook = useUpdateWorkBook();
  const sheet = workbook.currentSheet;

  const handleInputChange = useCallback(
    (newValue: string) => {
      setCurrentCell((prev) => (prev ? { ...prev, value: newValue } : prev));
    },
    [setCurrentCell],
  );

  const handleKeyPressInInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!currentCell) return;

      if (e.key === "Enter") {
        handleCellChange(
          currentCell.sheet,
          {
            rowNum: currentCell.rowNum,
            colNum: currentCell.colNum,
            newValue: currentCell.value,
          },
          updateWorkBook,
          cellCache.current,
          cellDependencies.current,
        );
        setCurrentCell(null);
      }

      if (e.key === "Escape") {
        setCurrentCell(null);
      }
    },
    [currentCell, setCurrentCell, updateWorkBook, cellCache, cellDependencies],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (currentCell && e.relatedTarget !== mainInputRef.current) {
        handleCellChange(
          currentCell.sheet,
          {
            rowNum: currentCell.rowNum,
            colNum: currentCell.colNum,
            newValue: currentCell.value,
          },
          updateWorkBook,
          cellCache.current,
          cellDependencies.current,
        );

        setCurrentCell((prev) =>
          prev ? { ...prev, isCurrentlySelected: false } : prev,
        );
      }
    },
    [
      currentCell,
      setCurrentCell,
      mainInputRef,
      updateWorkBook,
      cellCache,
      cellDependencies,
    ],
  );

  const updateCurrentCellValue = (
    cellRef: string,
    validCharacters: string[],
    inputRef: React.RefObject<HTMLInputElement>,
    modifyValueCallback?: (value: string, cellRef: string) => string,
  ) => {
    const activeInput =
      document.activeElement === inputRef.current
        ? inputRef.current
        : document.activeElement === mainInputRef.current
          ? mainInputRef.current
          : null;

    if (currentCell && activeInput) {
      const cursorPosition =
        activeInput.selectionStart ?? currentCell.value.length;

      setCurrentCell((prev) => {
        if (!prev) return prev;

        let { value } = prev;

        const preModValue = value;
        if (modifyValueCallback) {
          const valuePreCursor = value.slice(0, cursorPosition);
          const valuePostCursor = value.slice(cursorPosition);
          value =
            modifyValueCallback(valuePreCursor, cellRef) + valuePostCursor;
        }

        const lenRemoved = preModValue.length - value.length;

        if (
          (cursorPosition !== 0 &&
            validCharacters.includes(value[cursorPosition - 1]!)) ||
          dragging.start != null
        ) {
          const updatedValue =
            value.slice(0, cursorPosition - lenRemoved) +
            cellRef +
            value.slice(cursorPosition - lenRemoved);

          activeInput.value = updatedValue;
          activeInput.setSelectionRange(
            cursorPosition + cellRef.length - lenRemoved,
            cursorPosition + cellRef.length - lenRemoved,
          );

          return { ...prev, value: updatedValue };
        }

        return prev;
      });
    }
  };

  const handleCellClick = (
    rowNum: number,
    colNum: number,
    isDraggingFormula: boolean,
  ) => {
    if (eventManager.trigger("cellClick", rowNum, colNum)) {
      return;
    }

    if (!currentCell) {
      setCurrentCellFunc(rowNum, colNum, false);
    }
    if (isDraggingFormula && currentCell?.isCurrentlySelected == false) {
      handleDragFormula(rowNum, colNum);
    }

    let cellRef = sheet.id == currentCell?.sheet ? "" : sheet.name + "!";
    cellRef += `${getColumnLabel(colNum)}${rowNum + 1}`;
    const validCharacters = ["=", "+", "-", "*", "/", "(", ":", ";"];

    if (colNum === currentCell?.colNum && rowNum === currentCell?.rowNum)
      return;

    updateCurrentCellValue(cellRef, validCharacters, inputRef);
  };

  return {
    handleInputChange,
    handleKeyPressInInput,
    handleBlur,
    updateCurrentCellValue,
    handleCellClick
  };
};

export default useCellInputHandlers;

import React, { useCallback, useRef } from "react";
import { useEffect } from "react";
import type { CellProps } from "~/types/Cell";
import { useSheet } from "~/types/WorkBook"; 
import SuggestionFormulaList from "./SuggestionFormulaList";
import { useCellContext } from "~/contexts/useCellContext";
import { getColumnLabel } from "~/helpers/column";

const Cell = ({
  rowNum,
  colNum,
  value,
  displayValue,
  isEditing,

  style,
}: CellProps) => {
  const cellContext = useCellContext();
  const {
    onElementClick,
    onElementDoubleClick,
    onElementChange,
    onElementBlur,
    handleKeyPress,
    inputRef,
    setDragging,
    dragging,
    updateCurrentCellValue,
    setIsDraggingFormula,
    currentCell,
    setDraggedFormula,
    setSelectedAreas,
    setupDragging,
    isDraggingFormula,
    setDragHandler,
    dragHandler,
    setColumnWidths,
    draggedFormula,
  } = cellContext;

  const tableCellRef = useRef<null | HTMLTableCellElement>(null);
  const spanRef = useRef<null | HTMLSpanElement>(null);

  const workbook = useSheet();

  const scaleInput = useCallback((value: string) => {
    if (inputRef.current) {
      const font = window.getComputedStyle(inputRef.current).font;
      const width = measureTextWidth(value, font) + 10;

      const sizeOfTd =
        tableCellRef.current?.getBoundingClientRect().width ?? 72;

      inputRef.current.style.width = `${Math.max(sizeOfTd, width)}px`;
    }
  },[inputRef])

  useEffect(() => {
    

    if (isEditing && inputRef.current) {
      scaleInput(inputRef.current.value);
    }
  }, [isEditing, inputRef, scaleInput]);

 

  const handleClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    setupDragging(rowNum, colNum);
    e.preventDefault();
    onElementClick(rowNum, colNum, isDraggingFormula);
    setIsDraggingFormula(false);
  };

  useEffect(() => {
    scaleInput(value);
  }, [value, scaleInput]);

  useEffect(() => {
    const setSize = (value: string) => {
      if (spanRef.current) {
        const font = window.getComputedStyle(spanRef.current).font;
        const measuredWidth = measureTextWidth(value, font) + 10;
  
        setColumnWidths((prev) => {
          if (!prev[colNum] || prev[colNum] < measuredWidth) {
            return {
              ...prev,
              [colNum]: Math.max(measuredWidth, 80, prev[colNum] ?? 80),
            };
          }
          return prev; 
        });
      }
    };
  
    setSize(displayValue.toString());
  }, [displayValue, colNum, setColumnWidths]); 

  
  const measureTextWidth = (text: string, font: string): number => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }

    return tableCellRef.current?.getBoundingClientRect().width ?? 72;
  };

  const handleMouseMove = (rowNum: number, colNum: number) => {
    if (
      dragging.start &&
      currentCell?.isCurrentlySelected == false &&
      !isDraggingFormula
    ) {
      const start = dragging.start;

      const minRow = Math.min(start.rowNum, rowNum);
      const maxRow = Math.max(start.rowNum, rowNum);
      const minCol = Math.min(start.colNum, colNum);
      const maxCol = Math.max(start.colNum, colNum);

      setSelectedAreas([
        {
          start: { rowNum: minRow + 1, colNum: minCol + 1 },
          area: { sizeX: maxCol - minCol + 1, sizeY: maxRow - minRow + 1 },
          borderColor: "green",
          backgroundColor: "rgba(0, 255, 0, 0.2)",
          sheet: workbook.currentSheet,
        },
      ]);

      setDragHandler({
        endRow: maxRow,
        endCol: maxCol,
        startRow: minRow,
        startCol: minCol,
      });
    }
    if (dragging.start) {
      const start = dragging.start;

      const endRef = `${getColumnLabel(colNum)}${rowNum + 1}`;
      const startRef = `${getColumnLabel(start.colNum)}${start.rowNum + 1}`;

      const differentSheets = currentCell?.sheet != workbook.currentSheet.id;
      const shouldReverse =
        dragging.start.colNum > colNum || dragging.start.rowNum > rowNum;

      const validCharacters = ["=", "+", "-", "*", "/", "(", ":"];

      let expressionToAdd = shouldReverse
        ? `${endRef}:${startRef}`
        : `${startRef}:${endRef}`;

      if (differentSheets) {
        expressionToAdd = workbook.currentSheet.name + "!" + expressionToAdd;
      }

      setDragging((prev) => ({
        ...prev,
        end: { rowNum, colNum },
      }));

      updateCurrentCellValue(
        expressionToAdd,
        validCharacters,
        inputRef,
        (value) => {
          if (dragging.end) {
            const regexEx = differentSheets
              ? /([\w\d]+!)?[A-Z]+\d+:[A-Z]+\d+(?!.*[\w\d]+![A-Z]+\d+:[A-Z]+\d+)/ // Match last Sheet1!A1:B5 or A1:B5
              : /[A-Z]+\d+:[A-Z]+\d+(?!.*[A-Z]+\d+:[A-Z]+\d+)/; // Match last A1:B5
   
            return value.replace(regexEx, "");
          } else {
            const regexEx = differentSheets
              ? /([\w\d]+)!([A-Z]\d+)(?!.*\1!([A-Z]\d+))/
              : /([A-Z]\d+)(?!.*[A-Z]\d+)/;
    
            return value.replace(regexEx, "");
          }
        },
      );
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragging.start) {
        setDragging({ start: null, end: null });
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragging.start, setDragging]);

  const handleDrag = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    isDraggingFormula: boolean,
  ) => {
    if (currentCell?.isCurrentlySelected) return;

    if (isDraggingFormula) {
      setDraggedFormula(dragHandler);
      setDragging({
        start: {
          rowNum: dragHandler!.startRow,
          colNum: dragHandler!.startCol,
        },
        end: { rowNum: dragHandler!.endRow, colNum: dragHandler!.endCol },
      });
    } else if (
      dragHandler?.endRow !== rowNum ||
      dragHandler?.endCol !== colNum
    ) {
      setDragging((prev) => {
        setSelectedAreas([
          {
            start: { rowNum: rowNum + 1, colNum: colNum + 1 },
            area: { sizeX: 1, sizeY: 1 },
            borderColor: "green",
            backgroundColor: "rgba(0, 255, 0, 0.2)",
            sheet: workbook.currentSheet,
          },
        ]);
        setDragHandler({
          endRow: rowNum,
          endCol: colNum,
          startRow: rowNum,
          startCol: colNum,
        });
        return { start: { rowNum: rowNum, colNum }, end: prev.end };
      });
    }

    e.preventDefault();
  };

  const handleRelease = () => {
    if (draggedFormula !== null) {
      onElementClick(rowNum, colNum, true);

      setDragging({ start: null, end: null });
    }
    setDraggedFormula(null);
  };


  return (
    <div style={style} className={`${isEditing? "z-[40]": ""}`}>
      <div
        className={`excel-cell`}
        id={`cell-${rowNum}-${colNum}`}
        ref={tableCellRef}
        onMouseDown={(e) => handleDrag(e, false)}
      >
        {dragHandler?.endRow === rowNum && dragHandler?.endCol === colNum ? (
          <div
            className="fill-handle absolute bottom-0 right-0 h-2 w-2 cursor-pointer bg-blue-500"
            onMouseDown={(e) => handleDrag(e, true)}
          />
        ) : null}
        {isEditing ? (
          <>
            <SuggestionFormulaList
              value={value}
              onChange={onElementChange}
              handleKeyPress={handleKeyPress}
              inputRef={inputRef}
            >
              <input
                type="text"
                onBlur={onElementBlur}
                autoFocus
                className="excel-input absolute left-0 top-0 box-border h-full w-fit z-[10] bg-white"
              />
            </SuggestionFormulaList>
          </>
        ) : (
          <span
            ref={spanRef}
            onMouseUp={() => handleRelease()}
            onMouseDown={(e) => handleClick(e)}
            onMouseMove={() => handleMouseMove(rowNum, colNum)}
            onDoubleClick={() => onElementDoubleClick(rowNum, colNum)}
            className="flex h-full w-fit min-w-[100%] items-center justify-start whitespace-nowrap"
          >
            {displayValue !== "" ? displayValue : ""}
          </span>
        )}
      </div>
    </div>
  );
};

export default Cell;

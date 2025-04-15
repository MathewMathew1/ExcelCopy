import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSheet, useUpdateWorkBook } from "./Workbook";
import { clearCache, extractSelectedAreas, handleCellChange } from "~/helpers/sheetHelper";
import type { SelectedArea } from "./ColorfullStorage";
import { updateFormulaForDraggedCell } from "~/helpers/formulaHelper";
import SheetTabs from "./SheetTabs";
import {
  evaluateCellValue,
  findTargetSheet,
  getCellIndexes,
  getCellKey,
  parseCellReferenceWithSheet,
  sortCells,
} from "~/helpers/cellHelper";
import SuggestionFormulaList from "./SuggestionFormulaList";
import { CellContext } from "~/contexts/useCellContext";
import ExcelSheet from "./ExcelSheet";
import { getColumnLabel } from "~/helpers/column";
import SheetMenu from "./SheetMenu";
import type { Chart } from "@prisma/client";
import ChartEditor from "./ChartEditor";
import { EventManager } from "~/app/managers/EventManager";
import type { EventMap } from "~/app/managers/EventManager";
import type { CurrentCell } from "~/types/Cell";

const eventManager = new EventManager<EventMap>();

const Sheet = () => {
  const workbook = useSheet();
  const updateWorkBook = useUpdateWorkBook();
  const [selectedAreas, setSelectedAreas] = useState<SelectedArea[]>([]);
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
  const [currentCell, setCurrentCell] = useState<CurrentCell | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [chartData, setChartData] = useState<null | {
    showChart: boolean;
    chart: Chart | null;
  }>(null);

  const [dragging, setDragging] = useState<{
    start: { rowNum: number; colNum: number } | null;
    end: { rowNum: number; colNum: number } | null;
  }>({ start: null, end: null });
  const [isDraggingFormula, setIsDraggingFormula] = useState(true);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mainInputRef = useRef<HTMLInputElement | null>(null);

  const cellCache = useRef<Record<string, string | number>>({});
  const cellDependencies = useRef<Record<string, Set<string>>>({});

  const sheet = workbook.currentSheet;

  const getCellValue = useCallback(
    (
      cellRef: string,
      visited: Set<string> = new Set(),
      sheetId?: string,
    ): string | number => {
      const [sheetIdentifier, simpleRef] = parseCellReferenceWithSheet(
        cellRef,
        sheet.id,
        sheetId,
      );

      const targetSheet = findTargetSheet(sheetIdentifier, workbook);

      if (!targetSheet) return `#REF!`;
      if (Object.keys(workbook.cells).length === 0) return "";

      const { rowIndex, colIndex } = getCellIndexes(simpleRef);

      const cell = targetSheet.cells.find(
        (c) => c.colNum == colIndex && c.rowNum == rowIndex,
      );

      if (!cell) {
        const rowInSheet = rowIndex <= targetSheet.rowCount && rowIndex >= 0;
        const colInSheet = colIndex <= targetSheet.colCount && colIndex >= 0;
        if (!rowInSheet || !colInSheet) return `#REF!`;
      }

      const fullCellRef = `${targetSheet.id}!${simpleRef}`.toUpperCase();

      if (cellCache.current[fullCellRef] !== undefined) {
        return cellCache.current[fullCellRef];
      }
      if (visited.has(fullCellRef)) {
        visited.forEach((visitedCell) => {
          cellCache.current[visitedCell] = "#CIRC!";
        });
        cellCache.current[fullCellRef] = "#CIRC!";
        throw new Error("Circular reference");
      }

      visited.add(fullCellRef);

      const rawValue =
        workbook.cells[getCellKey(targetSheet, rowIndex, colIndex)];

      const result: string | number = evaluateCellValue(
        rawValue?.value,
        targetSheet,
        fullCellRef,
        visited,
        cellDependencies.current,
        getCellValue,
      );

      cellCache.current[fullCellRef] = result;

      return result;
    },
    [sheet.id, workbook],
  );

  const computedCellData = useMemo(() => {
    const newComputedCellData: Record<string, string | number> = {};

    for (const key in workbook.cells) {
      const cellKey = key;
      const value = workbook.cells[key];

      const columnNumber = value ? value.colNum : 1;
      const rowNumber = value ? value.rowNum : 1;

      try {
        newComputedCellData[cellKey] = getCellValue(
          `${getColumnLabel(columnNumber)}${rowNumber + 1}`,
        );
      } catch {
        newComputedCellData[cellKey] = `#CIRC!`;
      }
    }

    return newComputedCellData;
  }, [workbook, getCellValue]);

  useEffect(() => {
    if (!currentCell) {
      setSelectedAreas([]);
      return;
    }

    const newAreas = extractSelectedAreas(currentCell.value, sheet, workbook);

    setSelectedAreas(newAreas);
  }, [currentCell, sheet, workbook]);

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

  const handleDoubleClick = (rowNum: number, colNum: number) => {
    setCurrentCellFunc(rowNum, colNum);
  };

  const setCurrentCellFunc = (
    rowNum: number,
    colNum: number,
    setSelect = true,
  ) => {
    const cellKey = `${sheet.id}-${rowNum}-${colNum}`;
    const value = workbook.cells[cellKey]?.value ?? "";
    const updatedValue = value.replace(/([\w\d]+)!/g, (match, sheetId) => {
      const targetSheet = workbook.sheets.find((s) => s.id === sheetId);
      return targetSheet ? `${targetSheet.name}!` : match;
    });
    setCurrentCell({
      rowNum,
      colNum,
      value: updatedValue,
      sheet: sheet.id,
      isCurrentlySelected: setSelect,
    });
  };

  const handleInputChange = (newValue: string) => {
    setCurrentCell((prev) => (prev ? { ...prev, value: newValue } : prev));
  };

  const handleKeyPressInInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (sheet.id !== currentCell?.sheet) {
      updateWorkBook.setCurrentSheet(currentCell!.sheet);
    }

    if (e.key === "Enter" && currentCell) {
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

    if (e.key === "Escape" && currentCell) {
      setCurrentCell(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z"){ 
        const keys = workbook.cellDataMemento.undo();
  
        keys?.forEach(key => {
          clearCache(key.CellKeyAbc, cellCache.current, cellDependencies.current);
        })
        
      }
      if (e.ctrlKey && e.key === "y"){
        const keys =workbook.cellDataMemento.redo();
        keys?.forEach(key => {
          clearCache(key.CellKeyAbc, cellCache.current, cellDependencies.current);
        })
      }
    };

    window.addEventListener("keydown", listener);
    
    return () => window.removeEventListener("keydown", listener);
  }, [workbook.cellDataMemento.undo, workbook.cellDataMemento.redo, workbook.cellDataMemento]);

  const handleSort = ({
    start,
    end,
    sortAscending,
    sheetId,
  }: {
    start: { row: number; col: number };
    end: { row: number; col: number };
    sortAscending: boolean;
    sheetId: string;
  }) => {
    const sortedValues = sortCells({
      start,
      end,
      sortAscending,
      sheetId,
      cellData: workbook.cells,
      computedCellData,
    });

    const changes: {
      rowNum: number;
      colNum: number;
      newValue: string | null;
    }[] = [];
    for (const key in sortedValues) {
      const value = sortedValues[key]!;

      const change = {
        rowNum: value.rowNum,
        colNum: value.colNum,
        newValue: value.value,
      };
      changes.push(change);
    }

    handleCellChange(
      sheet.id,
      changes,
      updateWorkBook,
      cellCache.current,
      cellDependencies.current,
    );
  };

  const saveChangesInChart = async (chart: Chart) => {
    if (chartData?.chart) {
      await updateWorkBook.updateChartFunc(chart);
      setChartData(null);
      return;
    }

    await updateWorkBook.createChartFunc(chart, sheet.id);
    setChartData(null);
  };

  useEffect(() => {
    if (chartData === null || chartData?.showChart === false) {
      setSelectedAreas([]);
    }
  }, [chartData?.showChart, chartData]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT"
      ) {
        return;
      }

      if (!currentCell) return;

      let newRow = currentCell.rowNum;
      let newCol = currentCell.colNum;

      switch (e.key) {
        case "ArrowUp":
          newRow = Math.max(currentCell.rowNum - 1, 0);
          break;
        case "ArrowDown":
          newRow = currentCell.rowNum + 1;
          break;
        case "ArrowLeft":
          newCol = Math.max(currentCell.colNum - 1, 0);
          break;
        case "ArrowRight":
          newCol = currentCell.colNum + 1;
          break;
        default:
          return; // Don't do anything on other keys
      }

      setCurrentCell({ ...currentCell, rowNum: newRow, colNum: newCol });
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentCell]);

  return (
    <>
      <CellContext.Provider
        value={{
          eventManager,
          chartData,
          setChartData,
          columnWidths,
          setColumnWidths,
          handleSort,
          selectedAreas,
          setDraggedFormula,
          draggedFormula,
          setDragHandler,
          dragHandler,
          setSelectedAreas,
          setupDragging,
          setIsDraggingFormula,
          isDraggingFormula,
          currentCell,
          setCurrentCell,
          updateCurrentCellValue,
          dragging,
          inputRef,
          computedCellData,
          setDragging,
          onElementClick: (rowNum, colNum, isDraggingFormula) =>
            handleCellClick(rowNum, colNum, isDraggingFormula),
          onElementDoubleClick: (rowNum, colNum) =>
            handleDoubleClick(rowNum, colNum),
          onElementChange: (value) => handleInputChange(value),
          onElementBlur: handleBlur,
          handleKeyPress: handleKeyPressInInput,
        }}
      >
        <div
          className="sheet relative flex h-full flex-col"
        >
          <SheetMenu />
          <div className="workbook-container flex flex-col">
            <h1>{workbook?.workbookName}</h1>
            <h2>{sheet.name}</h2>
            <SuggestionFormulaList
              value={currentCell ? currentCell.value : ""}
              onChange={handleInputChange}
              handleKeyPress={handleKeyPressInInput}
              inputRef={mainInputRef}
            >
              <input
                disabled={currentCell == null}
                key="input"
                ref={mainInputRef}
                type="text"
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-1 text-gray-900 shadow-sm focus:outline-none"
              />
            </SuggestionFormulaList>

            <div className="worksheet relative min-h-[450px] w-full flex-grow overflow-hidden border border-gray-300">
              <ExcelSheet
                sheet={sheet}
                computedCellData={computedCellData}
                currentCell={currentCell}
              />
            </div>
            <SheetTabs key={"Tabs"} />
          </div>
        </div>
        {chartData?.showChart ? (
          <ChartEditor
            onSave={(chart) => saveChangesInChart(chart)}
            onCancel={() => setChartData(null)}
            sheet={sheet}
            existingChart={chartData.chart}
          />
        ) : null}
      </CellContext.Provider>
    </>
  );
};

export default Sheet;

import React, { useRef } from "react";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";
import SheetTabs from "./SheetTabs";
import SuggestionFormulaList from "./SuggestionFormulaList";
import { CellContext } from "~/contexts/useCellContext";
import ExcelSheet from "./ExcelSheet";
import SheetMenu from "./SheetMenu";
import ChartEditor from "./ChartEditor";
import { EventManager } from "~/app/managers/EventManager";
import type { EventMap } from "~/app/managers/EventManager";
import useCellState from "./Sheet/hooks/useCellState";
import useFormulaManagement from "./Sheet/hooks/useFormulaManagment";
import useKeyboardNavigation from "./Sheet/hooks/useKeyboardNavigation";
import useCellInputHandlers from "./Sheet/hooks/useCellInputHandlers";
import useSortHandler from "./Sheet/hooks/useSortHandler";
import useMacroRegistration from "~/contexts/useMacroRegister";
import useSheetActions from "~/contexts/useSheetActions";

const eventManager = new EventManager<EventMap>();

const Sheet = () => {
  const workbook = useSheet();
  const updateWorkBook = useUpdateWorkBook()

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mainInputRef = useRef<HTMLInputElement | null>(null);

  const {
    selectedAreas,
    setSelectedAreas,
    setCurrentCellFunc,
    currentCell,
    setCurrentCell,
    columnWidths,
    setColumnWidths,
    chartData,
    setChartData,
    computedCellData,
    cellCache,
    cellDependencies,
    saveChangesInChart,
    handleDoubleClick,
    saveChangeInCell
  } = useCellState();
  const { handleSort } = useSortHandler({
    computedCellData,
    cellCache,
    cellDependencies,
  });

  
  const sheetActions = useSheetActions({handleSort, addMacroStep: updateWorkBook.addMacroStep, saveChangesInChart, saveChangeInCell})

  const {
    draggedFormula,
    setDraggedFormula,
    handleDragFormula,
    dragHandler,
    setDragHandler,
    dragging,
    setDragging,
    isDraggingFormula,
    setIsDraggingFormula,
    setupDragging,
  } = useFormulaManagement({
    cellCache,
    cellDependencies,
    currentCell,
    inputRef,
    mainInputRef,
    ...sheetActions
  });

  useKeyboardNavigation({
    currentCell,
    setCurrentCell,
    cellCache,
    cellDependencies,
  });

  const {
    handleInputChange,
    handleKeyPressInInput,
    handleBlur,
    updateCurrentCellValue,
    handleCellClick,
  } = useCellInputHandlers({
    currentCell,
    setCurrentCell,
    mainInputRef,
    cellCache,
    cellDependencies,
    dragging,
    handleDragFormula,
    eventManager,
    inputRef,
    setCurrentCellFunc,
    ...sheetActions
  });



  const sheet = workbook.currentSheet;

  const { runMacroScript } = useMacroRegistration({
    cellCache: cellCache.current,
    cellDependencies: cellDependencies.current,
    saveChangesInChart,
    handleSort,
    computedCellData,
  });

  return (
    <>
      <CellContext.Provider
        value={{
          eventManager,
          chartData,
          setChartData,
          columnWidths,
          setColumnWidths,
          ...sheetActions,
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
          runMacroScript,
        }}
      >
        <div className="sheet relative flex h-full flex-col">
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
                className="z-[60] w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-1 text-gray-900 shadow-sm focus:outline-none"
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
            onSave={(chart) => sheetActions.saveChangesInChart(chart)}
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

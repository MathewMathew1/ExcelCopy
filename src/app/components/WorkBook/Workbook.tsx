"use client";
import React, {
  useEffect,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import Sheet from "~/app/components/WorkBook/Sheet";
import type { WorkBookWithSheets } from "~/types/WorkBook";
import { LoadingSpinner } from "../LoadingSpinner";
import type { CellData } from "~/types/Cell";
import { useCellDataMemento } from "~/contexts/useMementoCells";
import { useSheetMutations } from "~/contexts/useSheetMutations";
import { useChartMutations } from "~/contexts/useChartMutations";
import { useSheetLoader } from "~/contexts/useSheetLoader";
import { useCustomFunctionRegistration } from "~/contexts/useCustomFunctionRegistration";
import { useAutoSave } from "~/contexts/useAutoSaver";
import { useCustomFunctionsMutations } from "~/contexts/useCustomFunctionsMutations";
import { SheetContext, WorkBookUpdateContext } from "~/types/WorkBook";
import { useMacroMutations } from "~/contexts/useMacroMutations";
import useWorkbookActions from "~/contexts/useWorkbookActions";
import useMacroRecorder from "~/contexts/useMacroRecorder";

const Workbook = ({ workbook }: { workbook: WorkBookWithSheets }) => {
  const params = useParams<{ id: string }>();
  const idOfProject = params?.id ?? "1";

  const cellDataMemento = useCellDataMemento();

  const {
    renameSheetFunc,
    deleteSheetFunc,
    copySheetFunc,
    setCurrentSheetId,
    currentSheetId,
    changeSheetSize,
    createSheet
  } = useSheetMutations(workbook, idOfProject, cellDataMemento);

  const { versionOfCharts, deleteChartFunc, updateChartFunc, createChartFunc  } = useChartMutations(workbook);
  const { deleteCustomFunctionFunc } = useCustomFunctionsMutations()
  const isInitialized = useRef(false);
  useSheetLoader(workbook.sheets, currentSheetId, setCurrentSheetId);
  const { loadedCustomFunctions } = useCustomFunctionRegistration();
  

  const { markUnsaved, saveAll, handleUpdateSheet } = useAutoSave({
    currentSheetId,
    workbookSheets: workbook.sheets,
    cellData: cellDataMemento.cellData,
    workbook
  });

  const macroMutations = useMacroMutations()

  const macroRecorder = useMacroRecorder()
  const workbookActions = useWorkbookActions({copySheetFunc, addMacroStep: macroRecorder.addMacroStep})

  useEffect(() => {
    if(isInitialized.current) return
    isInitialized.current = true

    if (workbook && workbook.sheets.length > 0) {
      const initialData: Record<string, Record<string, CellData | null>> = {};
      workbook.sheets.forEach((sheet) => {
        const data:Record<string, CellData | null> = {}
        sheet.cells.forEach((cell) => {
          

          const key = `${sheet.id}-${cell.rowNum}-${cell.colNum}`
          data[key] = {
            value: cell.value ?? "",
            colNum: cell.colNum,
            rowNum: cell.rowNum,
            sheetId: sheet.id,
          };
        
        });
        initialData[sheet.id] = data
      });
      cellDataMemento.setInitialData(initialData);
    }
  }, [workbook.id, workbook, cellDataMemento]);


  const handleCellChange = (sheetId: string, changes:
    | { rowNum: number; colNum: number; newValue: string | null }
    | { rowNum: number; colNum: number; newValue: string | null }[],) => {
    const enrichedChanges = Array.isArray(changes)
      ? changes.map((c) => ({ ...c, sheetId }))
      : { ...changes, sheetId };
  
    cellDataMemento.updateCellData(enrichedChanges);
    markUnsaved(sheetId);
  };

  return (
    <>
      <SheetContext.Provider
        value={{
          currentSheet:
            workbook.sheets.find((s) => s.id === currentSheetId) ??
            workbook.sheets[0]!,
          cells: cellDataMemento.cellData,
          sheets: workbook?.sheets ?? [],
          workbookName: workbook.name,
          cellDataMemento: cellDataMemento,
        }}
      >
        <WorkBookUpdateContext.Provider
          value={{
            versionOfCharts,
            updateChartFunc,
            createChartFunc,
            changeSheetSize,
            saveAll,
            deleteCustomFunctionFunc,
            handleUpdateSheet,
            handleCellChange,
            createSheet,
            setCurrentSheet: setCurrentSheetId,
            deleteSheetFunc,
            renameSheetFunc,
            ...workbookActions,
            deleteChartFunc,
            ...macroMutations,
            ...macroRecorder
          }}
        >
          {loadedCustomFunctions ? (
            <Sheet key={"sheet"} />
          ) : (
            <div className="h-full w-full">
              <LoadingSpinner />
            </div>
          )}
        </WorkBookUpdateContext.Provider>
      </SheetContext.Provider>
    </>
  );
};

export default Workbook;

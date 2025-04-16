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
import { useMacroRegistration } from "~/contexts/useMacroRegristration";
import { useAutoSave } from "~/contexts/useAutoSaver";
import { useMacroMutations } from "~/contexts/useMacroMutations";
import { SheetContext, WorkBookUpdateContext } from "~/types/WorkBook";

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
  } = useSheetMutations(workbook, idOfProject);

  const { versionOfCharts, deleteChartFunc, updateChartFunc, createChartFunc  } = useChartMutations(workbook);
  const { deleteMacroFunc } = useMacroMutations()
  const isInitialized = useRef(false);
  useSheetLoader(workbook.sheets, currentSheetId, setCurrentSheetId);
  const { loadedMacros } = useMacroRegistration();

  const { markUnsaved, saveAll, handleUpdateSheet } = useAutoSave({
    currentSheetId,
    workbookSheets: workbook.sheets,
    cellData: cellDataMemento.cellData,
    workbook
  });

  useEffect(() => {
    if(isInitialized.current) return
    isInitialized.current = true

    if (workbook && workbook.sheets.length > 0) {
      const initialData: Record<string, CellData | null> = {};
      workbook.sheets.forEach((sheet) => {
        sheet.cells.forEach((cell) => {
          initialData[`${sheet.id}-${cell.rowNum}-${cell.colNum}`] = {
            value: cell.value ?? "",
            colNum: cell.colNum,
            rowNum: cell.rowNum,
            sheetId: sheet.id,
          };
        });
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
            deleteMacroFunc,
            handleUpdateSheet,
            handleCellChange,
            createSheet,
            setCurrentSheet: setCurrentSheetId,
            deleteSheetFunc,
            renameSheetFunc,
            copySheetFunc,
            deleteChartFunc,
          }}
        >
          {loadedMacros ? (
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

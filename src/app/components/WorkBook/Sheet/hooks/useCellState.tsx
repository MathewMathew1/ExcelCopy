import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";
import { extractSelectedAreas, handleCellChange } from "~/helpers/sheetHelper";
import {
  evaluateCellValue,
  getCellIndexes,
  getCellKey,
  parseCellReferenceWithSheet,
  findTargetSheet,
} from "~/helpers/cellHelper";
import type { CurrentCell } from "~/types/Cell";
import type { SelectedArea } from "../../ColorfullStorage";
import type { Chart } from "@prisma/client";
import { getColumnLabel } from "~/helpers/column";

const useCellState = () => {
  const updateWorkBook = useUpdateWorkBook();
  const workbook = useSheet();
  const [selectedAreas, setSelectedAreas] = useState<SelectedArea[]>([]);
  const [currentCell, setCurrentCell] = useState<CurrentCell | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [chartData, setChartData] = useState<null | {
    showChart: boolean;
    chart: Chart | null;
  }>(null);

  const cellCache = useRef<Record<string, string | number>>({});
  const cellDependencies = useRef<Record<string, Set<string>>>({});

  const sheet = workbook.currentSheet;

  const saveChangeInCell = (rowNum: number, colNum: number, newValue: string) => {
    if (!currentCell) return;

    handleCellChange(
      currentCell.sheet,
      {
        rowNum,
        colNum,
        newValue,
      },
      updateWorkBook,
      cellCache.current,
      cellDependencies.current,
    );
  }

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
        (c) => c.colNum === colIndex && c.rowNum === rowIndex,
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
        workbook.cells[targetSheet.id]![
          getCellKey(targetSheet, rowIndex, colIndex)
        ];

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

    for (const sheetKey in workbook.cells) {
      for (const key in workbook.cells[sheetKey]) {
        const cellKey = key;
        const value = workbook.cells[sheetKey][key];

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

  const setCurrentCellFunc = (
    rowNum: number,
    colNum: number,
    setSelect = true,
  ) => {
    const cellKey = `${sheet.id}-${rowNum}-${colNum}`;
    const value = workbook.cells[sheet.id]![cellKey]?.value ?? "";
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

  useEffect(() => {
    if (chartData === null || chartData?.showChart === false) {
      setSelectedAreas([]);
    }
  }, [chartData?.showChart, chartData]);

  useEffect(() => {
    if (!currentCell) {
      setSelectedAreas([]);
      return;
    }

    const newAreas = extractSelectedAreas(currentCell.value, sheet, workbook);

    setSelectedAreas(newAreas);
  }, [currentCell, sheet, workbook]);

  const saveChangesInChart = async (chart: Chart) => {
    if (chartData?.chart) {
      await updateWorkBook.updateChartFunc(chart);
      setChartData(null);
      return;
    }

    await updateWorkBook.createChartFunc(chart, sheet.id);
    setChartData(null);
  };

  const handleDoubleClick = (rowNum: number, colNum: number) => {
    setCurrentCellFunc(rowNum, colNum);
  };

  return {
    selectedAreas,
    setSelectedAreas,
    currentCell,
    setCurrentCell,
    columnWidths,
    setColumnWidths,
    chartData,
    setChartData,
    computedCellData,
    cellCache,
    cellDependencies,
    getCellValue,
    setCurrentCellFunc,
    saveChangesInChart,
    handleDoubleClick,
    saveChangeInCell
  };
};

export default useCellState;

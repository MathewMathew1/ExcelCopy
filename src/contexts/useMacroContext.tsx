import { useCallback } from "react";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";
import { registerAllMacros } from "./Macro/macroRegistery";
import { handleCellChange } from "~/helpers/sheetHelper";
import { getStartEndEndFromRange } from "~/helpers/rangehelpers";
import type { Chart, ChartMode, ChartType } from "@prisma/client";
import { getCellIndexes } from "~/helpers/cellHelper";

registerAllMacros();

const useMacroContext = ({
  cellCache,
  cellDependencies,
  saveChangesInChart,
  handleSort,
  computedCellData
}: {
  cellCache: Record<string, string | number>;
  cellDependencies: Record<string, Set<string>>;
  computedCellData: Record<string, string | number>;
  saveChangesInChart: (chart: Chart) => Promise<void>;
  handleSort: ({
    start,
    end,
    sortAscending,
    sheetId,
  }: {
    start: {
      row: number;
      col: number;
    };
    end: {
      row: number;
      col: number;
    };
    sortAscending: boolean;
    sheetId: string;
  }) => void;
}) => {
  const workbook = useSheet();
  const sheet = workbook.currentSheet;
  const updateWorkBook = useUpdateWorkBook();

  const updateCell = useCallback(
    (row: number, col: number, value: string) => {
      handleCellChange(
        sheet.id,
        [{ rowNum: row, colNum: col, newValue: value }],
        updateWorkBook,
        cellCache,
        cellDependencies,
      );
    },
    [sheet.id, updateWorkBook, cellCache, cellDependencies],
  );

  const sort = ({
    range,
    sortAscending,
  }: {
    range: string;
    sortAscending: boolean;
  }) => {
    const [startCell, endCell] = getStartEndEndFromRange(range);
    if (!startCell || !endCell) return;

    const start = { row: startCell.rowIndex, col: startCell.colIndex };
    const end = { row: endCell.rowIndex, col: endCell.colIndex };
   
    handleSort({ sheetId: sheet.id, sortAscending, start, end });
  };

  const createChart = async ({
    range,
    chartType,
    chartMode,
    width,
    height,
    anchorCell,
    name
  }: {
    range: string;
    chartType: ChartType;
    anchorCell: {row: number, col: number};
    width: number;
    chartMode: ChartMode;
    name: string;
    height: number;
  }) => {
    const [startCell, endCell] = getStartEndEndFromRange(range);


    if (!startCell || !endCell) return;
    const chart = {
      startRow: startCell.rowIndex,
      startCol: startCell.colIndex,
      endCol: endCell.colIndex,
      endRow: endCell.rowIndex,
      width,
      name,
      type: chartType,
      mode: chartMode,
      sheetId: sheet.id,
      anchorCol: anchorCell.col,
      anchorRow: anchorCell.row,
      height,
    };

    await saveChangesInChart(chart as Chart);
  };



  return {
    updateCell,
    sort,
    createChart,
    updateWorkBook
  };
};

export default useMacroContext;

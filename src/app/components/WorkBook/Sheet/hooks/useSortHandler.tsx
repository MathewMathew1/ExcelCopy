// hooks/useSortHandler.ts
import { useCallback } from "react";
import { sortCells } from "~/helpers/cellHelper";
import { handleCellChange } from "~/helpers/sheetHelper";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";

type UseSortHandlerProps = {
  cellCache: React.MutableRefObject<Record<string, string | number>>;
  cellDependencies: React.MutableRefObject<Record<string, Set<string>>>;
  computedCellData: Record<string, string | number>
};

export default function useSortHandler({cellCache, cellDependencies, computedCellData}: UseSortHandlerProps) {
  const workbook = useSheet();
  const updateWorkBook = useUpdateWorkBook();
  const sheet = workbook.currentSheet;

  const handleSort = useCallback(({
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
    console.log(computedCellData)
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
  }, [computedCellData, workbook.cells, sheet.id, updateWorkBook, cellCache, cellDependencies]);

  return { handleSort };
}

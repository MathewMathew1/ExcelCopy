import type { Sheet } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { VariableSizeGrid } from "react-window";
import { MemoizedListCell2 } from "./ListCell";
import ColorfulCellStorage from "./ColorfullStorage";
import { useCellContext } from "~/contexts/useCellContext";
import ChartOverlay from "./ChartOverlay";
import { useSheet } from "~/types/WorkBook";
import type { CurrentCell } from "~/types/Cell";
import { VirtualizedTable } from "@mathewmathew1/virtualized-list";
import { HeaderLeft, HeaderTop } from "./Header";
import type { VirtualizedTableRef } from "@mathewmathew1/virtualized-list";


const MIN_COLUMN_WIDTH = 80;

const ExcelSheet = ({
  sheet,
  currentCell,
  computedCellData,
}: {
  sheet: Sheet;
  currentCell: CurrentCell | null;
  computedCellData: Record<string, string | number>;
}) => {
  const gridRef = useRef<VirtualizedTableRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const cellContext = useCellContext();
  const workbook = useSheet();

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.updateVisualSinceCol(0);
    }
  }, [cellContext.columnWidths]);

  const cellContextRef = useRef(cellContext);

  useEffect(() => {
    cellContextRef.current = cellContext; // Keep the ref updated
  }, [cellContext]);

  useEffect(() => {
    cellContextRef.current.setColumnWidths([]);
  }, [workbook.currentSheet.id]);

  return (
    <>
      <div
        ref={containerRef}
        className="over relative flex h-full w-full bg-gray-200"
      ></div>

      <div className="absolute top-0 bg-white" id="excel-table">
        <VirtualizedTable
          ref={gridRef}
          AbsoluteElementComponent={AbsoluteElementComponent}
          CellComponent={MemoizedListCell2}
          columnCount={sheet.colCount ?? 0}
          rowCount={sheet.rowCount}
          columnWidths={(index: number) => {
            return cellContext.columnWidths[index] ?? MIN_COLUMN_WIDTH;
          }}
          rowHeights={25}
          height={dimensions.height}
          width={dimensions.width}
          additionalData={{ sheet, computedCellData, currentCell }}
          overScanCount={2}
          headers={{
            top: { component: HeaderTop, size: 25, type: "cell" },
            left: { component: HeaderLeft, size: 40, type: "cell" },
          }}
        ></VirtualizedTable>

        {/*<VariableSizeGrid
          className="h-full max-w-full"
          onScroll={({ scrollLeft, scrollTop }) => {
            setScrollLeft(scrollLeft);
            setScrollTop(scrollTop);
          }}
          ref={gridRef}
          columnCount={sheet.colCount ?? 0}
          rowCount={sheet.rowCount}
          columnWidth={(index) => {
            return cellContext.columnWidths[index] ?? MIN_COLUMN_WIDTH;
          }}
          rowHeight={() => 25}
          height={dimensions.height - 25}
          width={dimensions.width - 40}
          itemData={{ sheet, computedCellData, currentCell }}
        >
          {ListCell}
        </VariableSizeGrid>*/}
      </div>
    </>
  );
};

const AbsoluteElementComponent = ({
  offsetVersion,
  getElementLeftOffset,
  getElementTopOffset,
}: {
  getElementLeftOffset: (index: number) => number;
  getElementTopOffset: (index: number) => number;
  offsetVersion: number
}) => {
  return (
    <div className="relative">
      <ColorfulCellStorage
        getElementLeftOffset={getElementLeftOffset}
        getElementTopOffset={getElementTopOffset}
        offsetVersion={offsetVersion}
      />
      <ChartOverlay
        offsetVersion={offsetVersion}
        getElementLeftOffset={getElementLeftOffset}
        getElementTopOffset={getElementTopOffset}
      />
    </div>
  );
};

export default ExcelSheet;

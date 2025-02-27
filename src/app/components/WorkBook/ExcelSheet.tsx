import { Sheet } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeGrid as Grid, VariableSizeGrid } from "react-window";
import ListCell from "./ListCell";
import { getColumnLabel } from "~/helpers/column";
import ColorfulCellStorage from "./ColorfullStorage";
import { useCellContext } from "~/contexts/useCellContext";
import ChartOverlay from "./ChartOverlay";
import A from "./A";
import { useSheet } from "./Workbook";

const MIN_COLUMN_WIDTH = 80;

const ExcelSheet = ({
  sheet,
  currentCell,
  computedCellData,
}: {
  sheet: Sheet;
  currentCell: {
    rowNum: number;
    colNum: number;
    value: string;
    sheet: string;
    isCurrentlySelected: boolean;
  } | null;
  computedCellData: Record<string, string | number>;
}) => {
  const gridRef = useRef<VariableSizeGrid>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const cellContext = useCellContext();
  const [forceRender, setForceRender] = useState(0);
  const workbook = useSheet()

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

      gridRef.current.resetAfterIndices({
        columnIndex: 0,
        rowIndex: 0,
        shouldForceUpdate: true
      });
    }
  }, [cellContext.columnWidths]);

  useEffect(() => {
    cellContext.setColumnWidths([])
  }, [workbook.currentSheet.id]);

  return (
    <>
      <div ref={containerRef} className="relative flex h-full w-full bg-gray-200 over">
        {/* Column Headers (A, B, C...) */}
      </div>
      <div className="absolute top-0 flex h-[25px]  w-full overflow-hidden z-50">
        <div
          className=" w-full   top-0 flex flex-row"
          style={{ marginLeft: 40, transform: `translateX(-${scrollLeft}px)` }}
        >
          {Array.from({ length: sheet.colCount }, (_, i) => (
            <div
              key={i}
              className="h-[25px] flex-shrink-0 border-r border-gray-500 text-center"
              style={{
                width: cellContext.columnWidths[i] || MIN_COLUMN_WIDTH,
              }}
            >
              {getColumnLabel(i)}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-0 top-[25px] flex h-full w-[40px] overflow-hidden bg-gray-200 z-50">
        <div
          className="left-0 flex h-full flex-col "
          style={{ transform: `translateY(-${Math.round(scrollTop)}px)` }}
        >
          {Array.from(Array(sheet.rowCount)).map((_, i) => (
            <div
              key={i}
              className="border-box h-[25px] w-[40px] flex-shrink-0 border-b border-gray-500 text-center"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-[40px] top-[25px] bg-white" id="excel-table">
      <ChartOverlay scrollLeft={scrollLeft} scrollTop={scrollTop}/>
        <ColorfulCellStorage scrollLeft={scrollLeft} scrollTop={scrollTop} />
        
       <VariableSizeGrid
          key={forceRender}
          className="h-full max-w-full"
          onScroll={({ scrollLeft, scrollTop }) => {
            setScrollLeft(scrollLeft);
            setScrollTop(scrollTop);
          }}
          ref={gridRef}
          columnCount={sheet.colCount || 0}
          rowCount={sheet.rowCount}
          columnWidth={(index) => {
            return cellContext.columnWidths[index] || MIN_COLUMN_WIDTH;
          }}
          rowHeight={() => 25}
          height={dimensions.height - 25}
          width={dimensions.width - 40}
          itemData={{ sheet, computedCellData, currentCell }}
          
        >
          {ListCell}
        </VariableSizeGrid>
        
      </div>
    </>
  );
};


export default ExcelSheet;

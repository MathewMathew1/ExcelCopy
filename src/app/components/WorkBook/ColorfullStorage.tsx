import type { Sheet } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { useSheet } from "~/types/WorkBook";
import { useCellContext } from "~/contexts/useCellContext";

export type SelectedArea = {
  start: { rowNum: number; colNum: number };
  area?: { sizeX: number; sizeY: number };
  borderColor: string;
  backgroundColor: string;
  sheet: Sheet;
};

type Rectangle = {
  top: number;
  left: number;
  width: number;
  height: number;
  color: string;
  bg: string;
};

const ColorfulCellStorage = ({
  getElementLeftOffset,
  getElementTopOffset,
  offsetVersion
}: {
  getElementLeftOffset: (index: number) => number;
  getElementTopOffset: (index: number) => number;
  offsetVersion: number
}) => {
  const cellContext = useCellContext();
  const workbook = useSheet();
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);

  const selectedAreas = cellContext.selectedAreas;

  useEffect(() => {
    const tableElement = document.getElementById("excel-table");
    if (!tableElement) return;


    const newRects = selectedAreas.map((area) => {
      const { start, area: size, borderColor, backgroundColor, sheet } = area;
      if (sheet.id !== workbook.currentSheet.id) return null;

      const left = getElementLeftOffset(start.colNum-1);
      const top = getElementTopOffset(start.rowNum-1);

      const columnEndOffsetIndex = start.colNum - 1 + (size?.sizeX || 1)
      const rowEndOffsetIndex = start.rowNum - 1  + (size?.sizeY || 1)

      const leftOffsetEnd = getElementLeftOffset(columnEndOffsetIndex);
      const topOffsetEnd = getElementTopOffset(rowEndOffsetIndex);

      const width = leftOffsetEnd  - left
      const height = topOffsetEnd - top


      return {
        top: top,
        left: left,
        width,
        height,
        color: borderColor,
        bg: backgroundColor,
      };
    });

    setRectangles(newRects.filter(Boolean) as Rectangle[]);
  }, [workbook.currentSheet.id, selectedAreas,  offsetVersion]);

  return (
    <div className="relative" >
      <div className="absolute">
        {rectangles.map((rect, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              border: `2px solid ${rect.color}`,
              backgroundColor: rect.bg,
              pointerEvents: "none",
              zIndex: 40,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorfulCellStorage;

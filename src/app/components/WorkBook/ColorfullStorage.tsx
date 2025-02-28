import type { Sheet } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { useSheet } from "./Workbook";
import { useCellContext } from "~/contexts/useCellContext";

export type SelectedArea = {
  start: { rowNum: number; colNum: number };
  area?: { sizeX: number; sizeY: number };
  borderColor: string;
  backgroundColor: string;
  sheet: Sheet;
};

type Rectangle = { top: number; left: number; width: number; height: number; color: string; bg: string }

const ColorfulCellStorage = ({scrollLeft, scrollTop}: {scrollLeft: number, scrollTop: number}) => {
  const cellContext = useCellContext()
  const workbook = useSheet();
  const [rectangles, setRectangles] = useState<
  Rectangle[]
  >([]);

  const selectedAreas = cellContext.selectedAreas

  useEffect(() => {
    
    const tableElement = document.getElementById("excel-table"); 
    if (!tableElement) return;

    const tableRect = tableElement.getBoundingClientRect();

    const newRects = selectedAreas.map((area) => {
      const { start, area: size, borderColor, backgroundColor, sheet } = area;
      if (sheet.id !== workbook.currentSheet.id) return null;

      const startCell = document.getElementById(`cell-${start.rowNum-1}-${start.colNum-1}`);
      if (!startCell) return null;

      const rect = startCell.getBoundingClientRect();
      let width = rect.width;
      let height = rect.height;

      if (size?.sizeX && size.sizeX > 1) {
        for (let i = 1; i < size.sizeX; i++) {
          const cell = document.getElementById(`cell-${start.rowNum - 1}-${start.colNum + i - 1}`);
          if (cell) width += cell.getBoundingClientRect().width;
        }
      }

      if (size?.sizeY && size.sizeY > 1) {
        for (let j = 1; j < size.sizeY; j++) {
          const cell = document.getElementById(`cell-${start.rowNum + j}-${start.colNum}`);
          if (cell) height += cell.getBoundingClientRect().height;
        }
      }

      return {
        top: rect.top - tableRect.top  +scrollTop,
        left: rect.left - tableRect.left +scrollLeft,
        width,
        height,
        color: borderColor,
        bg: backgroundColor,
      };
    });


    setRectangles(newRects.filter(Boolean) as Rectangle[]);
  }, [workbook.currentSheet.id, scrollLeft, scrollTop, selectedAreas]);

  return (
    <div className="relative" style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}>
    <div className="absolute" > 
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


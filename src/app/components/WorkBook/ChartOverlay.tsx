import React, { useEffect, useState } from "react";
import { useSheet, useUpdateWorkBook } from "./Workbook";
import { useCellContext } from "~/contexts/useCellContext";
import ChartComponent from "./Charts/ChartComponent";
import { ChartBox } from "~/types/Chart";
import { Chart } from "@prisma/client";
import { useWorkbook } from "~/contexts/useWorkbook";

const ChartOverlay = ({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }) => {
  const workbook = useSheet();
  const [chartBoxes, setChartBoxes] = useState<
 {chartDisplayInfo: ChartBox, chart: Chart}[]
  >([]);

  const updateWorkBook = useUpdateWorkBook()
  const cellContext = useCellContext()
  const charts  = workbook.currentSheet.charts 

  useEffect(() => {
    const tableElement = document.getElementById("excel-table");
    if (!tableElement) return;

    const tableRect = tableElement.getBoundingClientRect();

    const newCharts = charts
      .filter((chart) => chart.sheetId === workbook.currentSheet.id)
      .map((chart) => {
        const startCell = document.getElementById(`cell-${chart.anchorRow}-${chart.anchorCol}`);
       
        if (!startCell) return null;

        const rect = startCell.getBoundingClientRect();

        return {chartDisplayInfo: {
          top: rect.top - tableRect.top + scrollTop,
          left: rect.left - tableRect.left + scrollLeft,
          width: chart.width,
          height: chart.height,
          type: chart.type,
        }, chart: chart}
      });
  
    setChartBoxes(newCharts.filter(Boolean) as any);
  }, [charts, workbook.currentSheet.id, scrollLeft, scrollTop, updateWorkBook.versionOfCharts]);

  useEffect(() => {
    const handleClick = (e: KeyboardEvent) => {

      if (e.key === "Delete") {
  
        if(cellContext.chartData?.chart?.id){
          updateWorkBook.deleteChartFunc(cellContext.chartData?.chart?.id)
          cellContext.setChartData(null)
        } 
            
      }
    };

    document.addEventListener("keydown", handleClick);

    return () => {
      document.removeEventListener("keydown", handleClick);
    };
  }, [cellContext.chartData]);

  return (
    <div className="relative z-[500]" style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}>
        {chartBoxes.map((chart, index) => (
          <ChartComponent chartDisplayInfo={chart.chartDisplayInfo} chart={chart.chart} key={`${index} chart`}/>
        ))}
    </div>
  );
};

export default ChartOverlay;

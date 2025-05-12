import React, { useEffect, useState } from "react";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";
import { useCellContext } from "~/contexts/useCellContext";
import ChartComponent from "./Charts/ChartComponent";
import type { ChartBox } from "~/types/Chart";
import type { Chart } from "@prisma/client";

const ChartOverlay = ({
  getElementLeftOffset,
  getElementTopOffset,
  offsetVersion
}: {
  getElementLeftOffset: (index: number) => number;
  getElementTopOffset: (index: number) => number;
   offsetVersion: number
}) => {
  const workbook = useSheet();
  const [chartBoxes, setChartBoxes] = useState<
    { chartDisplayInfo: ChartBox; chart: Chart }[]
  >([]);

  const updateWorkBook = useUpdateWorkBook();
  const cellContext = useCellContext();
  const charts = workbook.currentSheet.charts;

  useEffect(() => {
    const newCharts = charts
      .filter((chart) => chart.sheetId === workbook.currentSheet.id)
      .map((chart) => {
        const left = getElementLeftOffset(chart.anchorCol);
        const top = getElementTopOffset(chart.anchorRow);


        return {
          chartDisplayInfo: {
            top: top,
            left: left,
            width: chart.width,
            height: chart.height,
            type: chart.type,
          },
          chart: chart,
        };
      });

    setChartBoxes(
      newCharts.filter(Boolean) as {
        chartDisplayInfo: ChartBox;
        chart: Chart;
      }[],
    );
  }, [
    charts,
    workbook.currentSheet.id,
    updateWorkBook.versionOfCharts,
    offsetVersion
  ]);

  useEffect(() => {
    const handleClick = async (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        if (cellContext.chartData?.chart?.id) {
          await updateWorkBook.deleteChartFunc(
            cellContext.chartData?.chart?.id,
          );
          cellContext.setChartData(null);
        }
      }
    };

    document.addEventListener("keydown", handleClick);

    return () => {
      document.removeEventListener("keydown", handleClick);
    };
  }, [cellContext.chartData, cellContext, updateWorkBook]);

  return (
    <div className="relative z-[66]">
      {chartBoxes.map((chart, index) => (
        <ChartComponent
          chartDisplayInfo={chart.chartDisplayInfo}
          chart={chart.chart}
          key={`${index} chart`}
        />
      ))}
    </div>
  );
};

export default ChartOverlay;

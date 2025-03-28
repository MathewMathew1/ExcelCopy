"use client";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, LineElement } from "chart.js";
import type { Chart } from "@prisma/client";
import { useCellContext } from "~/contexts/useCellContext";
import type { ChartBox } from "~/types/Chart";
import { useEffect, useState } from "react";
import "chart.js/auto";
import { getColumnLabel } from "~/helpers/column";
import PieChartComponent from "./PieChartComponent";
import BarChartComponent from "./BarChartComponent";
import LineChartComponent from "./LineChartComponent";


ChartJS.register(ArcElement, Tooltip, Legend, BarElement, LineElement);

export type ChartDataType = {
  labels: string[];
  datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      hoverBackgroundColor: string[];
  }[];
}

export type ChartOptions = {
  maintainAspectRatio: boolean;
  responsive: boolean;
  plugins: {
      legend: {
          position: "top" | "center" | "left" | "right" | "bottom";
      };
      title: {
          display: boolean;
          text: string;
          align: "center" | "start" | "end";
      };
  };
}

const ChartComponentsMap: Record<string, React.FC<{ data: ChartDataType; options: ChartOptions }>> = {
  PIE: PieChartComponent,
  BAR: BarChartComponent,
  LINE: LineChartComponent,
};

const ChartComponent = ({
  chart,
  chartDisplayInfo,
}: {
  chart: Chart;
  chartDisplayInfo: ChartBox;
}) => {
  const { startRow, startCol, endRow, endCol, mode, type } = chart;
  const cellContext = useCellContext();

  const [chartData, setChartData] = useState<{
    labels: string[];
    values: number[];
  }>({
    labels: [],
    values: [],
  });

  useEffect(() => {
    const newLabels: string[] = [];
    const newValues: number[] = [];
    const dataMap: Record<string, number> = {};

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const key = `${chart.sheetId}-${row}-${col}`;
        const value = cellContext.computedCellData[key];

        if (value === null || value === undefined) continue;

        const numericValue = Number(value);
        if (isNaN(numericValue)) continue; // Skip non-numeric values

        if (mode === "COUNT") {
          dataMap[numericValue] = (dataMap[numericValue] ?? 0) + 1;
        } else if (mode === "SUM") {
          dataMap[`${getColumnLabel(col) + (row+1)}`] = numericValue;
        }
      }
    }

    Object.entries(dataMap).forEach(([label, value]) => {
      newLabels.push(label);
      newValues.push(value);
    });

    setChartData({ labels: newLabels, values: newValues });
  }, [chart, cellContext.computedCellData, endCol, endRow, mode, startCol, startRow]);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: chart.name,
        data: chartData.values,
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"],
      },
    ],
  };

  const options: ChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: chart.name,
        align: "center",
      },
    },
  };

  const ChartComponentToRender = ChartComponentsMap[type] ?? (() => <p>Unsupported chart type</p>);

  return (
    <div
      onClick={()=>cellContext.setChartData({showChart: true, chart})}
      className={`absolute z-[9999] rounded-lg border border-gray-600 bg-slate-100 p-4 shadow-lg ${cellContext.chartData?.chart?.id === chart.id? "border-green-600 border-2": ""}`}
      style={{
        top: chartDisplayInfo.top,
        left: chartDisplayInfo.left,
        width: chartDisplayInfo.width,
        height: chartDisplayInfo.height,
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
      }}
    >
      <ChartComponentToRender data={data} options={options} />
    </div>
  );
};

export default ChartComponent;


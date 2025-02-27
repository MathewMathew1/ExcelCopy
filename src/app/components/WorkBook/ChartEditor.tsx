import { useState, useEffect } from "react";

import { Chart, ChartMode, ChartType, Sheet } from "@prisma/client";
import Button from "../Button";
import { ChartWithStringValues } from "~/types/Cell";
import { useCellContext } from "~/contexts/useCellContext";
import { predefinedColors } from "~/helpers/colorsTriangle";
import { SelectedArea } from "./ColorfullStorage";

interface ChartEditorProps {
  sheet: Sheet;
  existingChart?: Chart | null;
  onSave: (chartData: Chart) => void;
  onCancel: () => void;
}

const columnToLetter = (col: number): string => {
  let letter = "";
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
};

const cellToIndices = (cell: string) => {
  if (!cell) return { row: 1, col: 1 }; // Default to A1

  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { row: 1, col: 1 };

  const col = match[1]!
    .split("")
    .reduce(
      (acc, letter) =>
        acc * 26 + (letter.charCodeAt(0) - "A".charCodeAt(0) + 1),
      0,
    );

  const row = parseInt(match[2]!, 10);

  return { row, col };
};

const ChartEditor: React.FC<ChartEditorProps> = ({
  sheet,
  existingChart,
  onSave,
  onCancel,
}) => {
  const [chartData, setChartData] = useState<Partial<ChartWithStringValues>>({
    name: "",
    type: ChartType.PIE,
    startRow: 0,
    startCol: 0,
    endRow: 1,
    endCol: 0,
    anchorRow: 0,
    anchorCol: 9,
    mode: ChartMode.SUM,
    width: 300,
    height: 300,
    startCell: "A1",
    endCell: "A2",
    anchorCell: "J1",
  });
  const [activeField, setActiveField] = useState<"startCell" | "endCell" | "anchorCell" | null>(null);
  const cellContext = useCellContext();

  useEffect(() => {
    if (existingChart) {
      setChartData({
        ...existingChart,
        startCell: `${columnToLetter(existingChart.startCol + 1) + (existingChart.startRow + 1)}`,
        endCell: `${columnToLetter(existingChart.endCol + 1) + (existingChart.endRow + 1)}`,
        anchorCell: `${columnToLetter(existingChart.anchorCol + 1) + (existingChart.anchorRow + 1)}`,
      });
    }
  }, [existingChart]);

  const handleChange = (
    field: keyof ChartWithStringValues,
    value: string | number,
  ) => {
    setChartData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const handleClick = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cellContext.setChartData(null);
      }
    };

    document.addEventListener("keydown", handleClick);

    return () => {
      document.removeEventListener("keydown", handleClick);
    };
  }, []);

  const extractSelectedAreasFromIndices = (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    anchorRow: number,
    anchorCol: number,
    sheet: Sheet, // Default sheet
  ): SelectedArea[] => {
    if (
      startRow === undefined ||
      startCol === undefined ||
      endRow === undefined ||
      endCol === undefined ||
      anchorRow === undefined ||
      anchorCol === undefined
    )
      return [];

    const sheetReferenced = sheet;

    // Selection area (from start to end)
    const selectionArea: SelectedArea = {
      sheet: sheetReferenced,
      start: {
        rowNum: Math.min(startRow, endRow) + 1,
        colNum: Math.min(startCol, endCol) + 1,
      },
      area: {
        sizeX: Math.abs(endCol - startCol) + 1,
        sizeY: Math.abs(endRow - startRow) + 1,
      },
      borderColor: predefinedColors[0]!.borderColor,
      backgroundColor: predefinedColors[0]!.backgroundColor,
    };

    // Anchor cell area (single cell)
    const anchorArea: SelectedArea = {
      sheet: sheetReferenced,
      start: { rowNum: anchorRow + 1, colNum: anchorCol + 1 },
      area: {
        sizeX: 1,
        sizeY: 1,
      },
      borderColor: predefinedColors[1]!.borderColor, // Different color
      backgroundColor: predefinedColors[1]!.backgroundColor,
    };

    return [selectionArea, anchorArea];
  };

  useEffect(() => {

    let areas: SelectedArea[] = [];
    const startIndices = cellToIndices(chartData.startCell!);
    const endIndices = cellToIndices(chartData.endCell!);
    const anchorIndices = cellToIndices(chartData.anchorCell!);

    areas = extractSelectedAreasFromIndices(
      startIndices.row - 1,
      startIndices.col - 1,
      endIndices.row - 1,
      endIndices.col - 1,
      anchorIndices.row - 1,
      anchorIndices.col - 1,
      sheet,
    );
    setChartData((prev) => {
      return {
        ...prev,
        startRow: startIndices.row - 1,
        startCol: startIndices.col - 1,
        endRow: endIndices.row - 1,
        endCol: endIndices.col - 1,
        anchorRow: anchorIndices.row - 1,
        anchorCol: anchorIndices.col - 1,
      };
    });

    cellContext.setSelectedAreas(areas);
  }, [chartData.startCell, chartData.endCell, chartData.anchorCell]);

  useEffect(() => {
    const handleCellClick = (row: number, col: number) => {
      if (!activeField) return false; 

      const newCell = `${columnToLetter(col + 1)}${row + 1}`;
      handleChange(activeField, newCell);

      return true; 
    };

    cellContext.eventManager.register("cellClick", handleCellClick, 10);
    return () => {
      cellContext.eventManager.unregister("cellClick", handleCellClick);
    };
  }, [activeField]);

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col overflow-auto border-l bg-white p-6 shadow-xl">
      <h2 className="mb-4 border-b pb-2 text-lg font-semibold">
        {existingChart ? "Edit Chart" : "Create Chart"}
      </h2>

      {/* Chart Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Chart Name
        </label>
        <input
          type="text"
          value={chartData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Enter chart name"
          className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Chart Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Chart Type
        </label>
        <select
          value={chartData.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        >
          {(Object.keys(ChartType) as Array<keyof typeof ChartType>).map(
            (value, index) => (
              <option value={value} key={index}>
                {value}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Start & End Positions */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Cell
          </label>
          <input
            type="text"
            value={chartData.startCell}
            onChange={(e) =>
              handleChange("startCell", e.target.value.toUpperCase())
            }
            placeholder="e.g., A1"
            onFocus={() => setActiveField("startCell")}
            className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Cell
          </label>
          <input
            type="text"
            value={chartData.endCell}
            onChange={(e) =>
              handleChange("endCell", e.target.value.toUpperCase())
            }
            placeholder="e.g., C5"
            onFocus={() => setActiveField("endCell")}
            className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Chart Mode */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Chart Mode
        </label>
        <select
          value={chartData.mode}
          onChange={(e) => handleChange("mode", e.target.value)}
          className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        >
          {(Object.keys(ChartMode) as Array<keyof typeof ChartMode>).map(
            (value, index) => (
              <option value={value} key={index}>
                {value}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Anchor Position */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Anchor Cell
        </label>
        <input
          type="text"
          value={chartData.anchorCell}
          onChange={(e) =>
            handleChange("anchorCell", e.target.value.toUpperCase())
          }
          placeholder="e.g., J1"
          onFocus={() => setActiveField("anchorCell")}
          className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Chart Size */}
      <h3 className="mt-4 border-t pt-3 text-sm font-semibold">Chart Size</h3>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Width
          </label>
          <input
            type="number"
            value={chartData.width}
            onChange={(e) => handleChange("width", parseInt(e.target.value))}
            className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Height
          </label>
          <input
            type="number"
            value={chartData.height}
            onChange={(e) => handleChange("height", parseInt(e.target.value))}
            className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end gap-4 border-t pt-4">
        <Button color="red" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="green" onClick={() => onSave(chartData as Chart)}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default ChartEditor;

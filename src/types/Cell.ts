import type { Chart } from "@prisma/client";
import type { SelectedArea } from "~/app/components/WorkBook/ColorfullStorage";
import type { EventManager, EventMap } from "~/app/managers/EventManager";

type DraggingState = {
  start: { rowNum: number; colNum: number } | null;
  end: { rowNum: number; colNum: number } | null;
};

export type CellProps = {
  rowNum: number;
  colNum: number;
  value: string;
  displayValue: string | number;
  isEditing: boolean;

  style: React.CSSProperties;
};

export type CellContextProps = {
  dragging: DraggingState;
  onElementClick: (
    rowNum: number,
    colNum: number,
    isDraggingFormula: boolean,
  ) => void;
  onElementDoubleClick: (rowNum: number, colNum: number) => void;
  onElementChange: (newValue: string) => void;
  computedCellData: Record<string, string | number>;
  onElementBlur: (e: React.FocusEvent<HTMLInputElement, Element>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  setDragging: React.Dispatch<React.SetStateAction<DraggingState>>;
  updateCurrentCellValue: (
    cellRef: string,
    validCharacters: string[],
    inputRef: React.RefObject<HTMLInputElement>,
    modifyValueCallback?: (value: string, cellRef: string) => string,
  ) => void;
  setCurrentCell: React.Dispatch<
    React.SetStateAction<{
      rowNum: number;
      colNum: number;
      value: string;
      sheet: string;
      isCurrentlySelected: boolean;
    } | null>
  >;
  currentCell: CurrentCell|null
  setIsDraggingFormula: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingFormula: boolean;
  setupDragging: (rowNum: number, colNum: number) => void;
  setSelectedAreas: React.Dispatch<React.SetStateAction<SelectedArea[]>>;
  setDragHandler: React.Dispatch<
    React.SetStateAction<{
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    } | null>
  >;
  dragHandler: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null;
  setDraggedFormula: React.Dispatch<
    React.SetStateAction<{
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    } | null>
  >;
  draggedFormula: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null;
  selectedAreas: SelectedArea[];
  setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>;
  columnWidths: number[];
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
  setChartData: React.Dispatch<
    React.SetStateAction<{
      showChart: boolean;
      chart: Chart | null;
    } | null>
  >;
  chartData: {
    showChart: boolean;
    chart: Chart | null;
  } | null;
  eventManager: EventManager<EventMap>
};

export type CellData = {
  value: string;
  colNum: number;
  rowNum: number;
  sheetId: string
};

export type CellDataWithNull = {
  value: string | null;
  colNum: number;
  rowNum: number;
};

export type ChartWithStringValues = Chart & {
  startCell: string;
  endCell: string;
  anchorCell: string;
};

export type CurrentCell = {
  rowNum: number;
  colNum: number;
  value: string;
  sheet: string;
  isCurrentlySelected: boolean;
} 

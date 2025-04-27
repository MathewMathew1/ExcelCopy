import { Chart } from "@prisma/client";
import { formatRange } from "~/helpers/cellHelper";
import { getColumnLabel } from "~/helpers/column";

type useSheetActionsProps = {
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
  saveChangesInChart: (chart: Chart) => Promise<void>;
  addMacroStep: (step: string) => void;
  saveChangeInCell: (rowNum: number, colNum: number, newValue: string) => void
};

const useSheetActions = ({
  handleSort,
  addMacroStep,
  saveChangesInChart,
  saveChangeInCell
}: useSheetActionsProps) => {
  type HandleSortParams = Parameters<typeof handleSort>[0];
  const handleSortAction = ({
    start,
    end,
    sortAscending,
    sheetId,
  }: HandleSortParams) => {
    const range = formatRange(start, end);
    const direction = sortAscending ? "asc" : "desc";

    const command = `SORT_RANGE -range ${range} -${direction}`;

    addMacroStep(command);

    return handleSort({ start, end, sortAscending, sheetId });
  };

  const saveChangesInChartAction = async (chart: Chart) => {
    const range = formatRange(
      { row: chart.startRow, col: chart.startCol },
      { row: chart.endRow, col: chart.endCol },
    );

    const command = `CREATE_CHART -range ${range} -chartType ${chart.type} -anchor ${getColumnLabel(chart.anchorCol)}${chart.anchorRow + 1} -width ${chart.width} -height ${chart.height} -name ${chart.name} -mode ${chart.mode}`;
   
    addMacroStep(command);

    return saveChangesInChart(chart);
  };

  const saveChangeInCellAction = (rowNum: number, colNum: number, newValue: string) =>{
    const command = `SET_VALUE -cell ${getColumnLabel(colNum)}${rowNum+1} -value "${newValue}"`;  
   
    addMacroStep(command);
    saveChangeInCell(rowNum, colNum, newValue)
  }
  

  return {
    handleSort: handleSortAction,
    saveChangesInChart: saveChangesInChartAction,
    saveChangeInCell: saveChangeInCellAction
  };
};

export default useSheetActions;

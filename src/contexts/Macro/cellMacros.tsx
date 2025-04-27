import { MacroTypeEnum, MacroHandlers } from "~/types/Macro";
import {
  getCellRangeValues,
  getStartEndEndFromRange,
} from "~/helpers/rangehelpers";

export const registerCellMacros = (registry: MacroHandlers) => {
  registry[MacroTypeEnum.SET_VALUE] = (step, { updateCell }) => {
    updateCell(step.cell.row, step.cell.col, step.value);
  };

  registry[MacroTypeEnum.SUM_RANGE] = (
    step,
    { updateCell, computedCellData, sheetId },
  ) => {
    const values = getCellRangeValues(step.range, sheetId, computedCellData);
    const sum = values.reduce((acc, val) => acc + Number(val || 0), 0);
    updateCell(step.target.row, step.target.col, sum.toString());
  };

  registry[MacroTypeEnum.CLEAR_RANGE] = (step, { updateCell }) => {
    const [startCell, endCell] = getStartEndEndFromRange(step.range);
    if (!startCell || !endCell) return;

    for (let i = startCell.rowIndex; i <= endCell.rowIndex; i++) {
      for (let a = startCell.colIndex; a <= endCell.colIndex; a++) {
        updateCell(i, a, "");
      }
    }
  };

  registry[MacroTypeEnum.COPY_SHEET] = async (_step, { updateWorkBook, sheetId }) => {
    void updateWorkBook.copySheetFunc(sheetId);
  };
};

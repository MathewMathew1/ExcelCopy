
import {  MacroTypeEnum, MacroStepByType, MacroHandlers } from "~/types/Macro";

export const registerSortMacros = (registry: MacroHandlers) => {
  registry[MacroTypeEnum.SORT_RANGE] = (
    step: MacroStepByType[MacroTypeEnum.SORT_RANGE],
    { sort }
  ) => {
    const { range, ascending } = step; 
   
    sort({ range, sortAscending: ascending ?? true });
  };
};

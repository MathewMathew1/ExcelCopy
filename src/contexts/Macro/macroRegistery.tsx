// helpers/macros/macroRegistry.ts
import { MacroStep, MacroHandlers } from "~/types/Macro";
import { registerCellMacros } from "./cellMacros";
import { registerSortMacros } from "./sortMacros";
import { registerChartMacros } from "./chartMacros";


const macroHandlers: MacroHandlers = {};

export const registerAllMacros = () => {

  registerCellMacros(macroHandlers);
  registerSortMacros(macroHandlers);
  registerChartMacros(macroHandlers);
};

export const getMacroHandler = (type: MacroStep["type"]) => macroHandlers[type];




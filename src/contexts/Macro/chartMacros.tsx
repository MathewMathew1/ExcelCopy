
import { MacroHandlers, MacroStepByType, MacroTypeEnum } from "~/types/Macro";

export const registerChartMacros = (registry: MacroHandlers) => {

  registry[MacroTypeEnum.CREATE_CHART] = (
      step: MacroStepByType[MacroTypeEnum.CREATE_CHART],
      { createChart }
    ) => {
      const {  mode } = step;
     
      createChart({...step, chartMode: mode })
    };

};

import { ArgType, ChartMode, ChartType } from "@prisma/client";
import { z } from "zod";
import { WorkBookUpdateContextProps } from "./WorkBook";

export const MacroArgSchema = z.object({
  name: z.string().min(1, "Argument name is required"),
  type: z.nativeEnum(ArgType),
  description: z.string(),
});

export const CONVERTED_TYPE_ARGS = {
  [ArgType.STRING]: "string",
  [ArgType.NUMBER]: "number",
  [ArgType.BOOLEAN]: "boolean",
  [ArgType.DATE]: "date",
};

export enum MacroTypeEnum {
  SET_VALUE = "SET_VALUE",
  CLEAR_RANGE = "CLEAR_RANGE",
  SUM_RANGE = "SUM_RANGE",
  SORT_RANGE = "SORT_RANGE",
  COPY_SHEET = "COPY_SHEET",
  CREATE_CHART = "CREATE_CHART"
}

export const macroFieldSchemas = {
  [MacroTypeEnum.SET_VALUE]: {
    type: { type: "string" },
    cell: { type: "cell" },
    value: { flag: "value", type: "string", required: true },
  },
  [MacroTypeEnum.SUM_RANGE]: {
    type: { type: "string" },
    target: { type: "cell" }, // parse into {row, col}
    range: { flag: "range", type: "range", required: true },
  },
  [MacroTypeEnum.SORT_RANGE]: {
    type: { type: "string" },
    range: { flag: "range", type: "range", required: true },
    ascending: { flag: "asc", type: "boolean" }, // defaults to true
  },
  [MacroTypeEnum.CLEAR_RANGE]: {
    type: { type: "string" },
    range: { flag: "range", type: "range", required: true },
  },
  [MacroTypeEnum.COPY_SHEET]: {
    type: { type: "string" },
  },
  [MacroTypeEnum.CREATE_CHART]: {
    type: { type: "string" },
    range: { flag: "range", type: "range", required: true },
    chartType: { flag: "chartType", type: "enum", enumType: ChartType },
    anchorCell: { flag: "anchor", type: "cell" },
    width: { flag: "width", type: "number" },
    height: { flag: "height", type: "number" },
    name: { flag: "name", type: "string" },
    mode: { flag: "mode", type: "enum", enumType: ChartMode },
  },
} as const;

export type MacroHandlers = {
  [K in MacroTypeEnum]?: (args: MacroStepByType[K], deps: MacroHandlerDeps) => void;
};

type FieldTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  cell: { row: number; col: number };
  range: string;
  enum: string;
};

type ConvertSchemaToType<T> = {
  [K in keyof T]: T[K] extends { type: keyof FieldTypeMap }
    ? T[K] extends { enumType: infer EnumT }
      ? EnumT extends object
        ? EnumT[keyof EnumT] // enum support
        : FieldTypeMap[T[K]["type"]]
      : FieldTypeMap[T[K]["type"]]
    : never;
};

type MacroFieldSchemas = typeof macroFieldSchemas;

export type MacroStepByType = {
  [K in keyof MacroFieldSchemas]: {
    type: K;
  } & ConvertSchemaToType<MacroFieldSchemas[K]>;
};

export type MacroStep = {
  [K in keyof MacroFieldSchemas]: {
    type: K;
  } & ConvertSchemaToType<MacroFieldSchemas[K]>;
}[keyof MacroFieldSchemas];



export type MacroType = MacroTypeEnum;

export type MacroField =
  | {
      type: "string" | "number" | "boolean" | "cell" | "range";
      flag?: string;
      required?: boolean;
    }
  | {
      type: "enum";
      flag?: string;
      required?: boolean;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      enumType: Record<string, any>;
    };

export interface MacroHandlerDeps {
  updateCell: (row: number, col: number, value: string) => void;
  updateWorkBook: WorkBookUpdateContextProps;
  computedCellData: Record<string, string | number>;
  sheetId: string;
  cellCache: Record<string, string | number>;
  cellDependencies: Record<string, Set<string>>;
  createChart: ({
    range,
    chartType,
    chartMode,
    width,
    height,
    anchorCell,
    name,
  }: {
    range: string;
    chartType: ChartType;
    anchorCell: {row: number, col: number}
    width: number;
    chartMode: ChartMode;
    name: string;
    height: number;
  }) => void;
  sort: ({
    range,
    sortAscending,
  }: {
    range: string;
    sortAscending: boolean;
  }) => void;
}

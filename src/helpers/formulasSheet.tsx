import { SHEET_ERRORS } from "~/types/ErrorSheet";
import { safeEvaluate } from "./sheetHelper";
import { Parser } from "expr-eval";
import type { FormulaArg } from "~/types/Formula";

interface FormulaMetadata {
  description: string;
  args: FormulaArg[];
  example?: string;
}

type Context = {
  getCellValue: (cellRef: string) => string | number | null
}

export abstract class FormulaFunctions {
  private static functions: Record<
    string,
    (
      args: (string | number)[],
      context: Context,
    ) => number | string
  > = {};

  private static metadata: Record<string, FormulaMetadata> = {};

  static register<T extends (string | number | Date)[]>(
    name: string,
    handler: (args: T, context: Context) => number | string,
    metadata: FormulaMetadata,
  ) {
    this.functions[name.toUpperCase()] = (
      args: (string|number)[],
      context: Context,
    ) => {
      const convertedArgs = this.convertArgs(args, metadata, context);
      if (convertedArgs === SHEET_ERRORS.ARGS) return SHEET_ERRORS.ARGS;

      return handler(convertedArgs as T, context);
    };

    this.metadata[name.toUpperCase()] = metadata;
  }

  private static convertArgs(
    args: (string|number)[],
    metadata: FormulaMetadata,
    context: Context
  ): (string | number | Date | number[])[] | string {
    if (metadata.args[0]?.type === "number[]") {
      return args.map((item) => {
        
        let numArg =
          typeof item === "number" ? item : safeEvaluate(item, context.getCellValue);
        numArg = Number.isNaN(numArg) ? 0 : numArg;
        return numArg;
      });
    }

    return args.map((arg, index) => {
      const expectedType = metadata.args[index]?.type;
  
      if (!expectedType) return arg; // No conversion needed if type is not specified

      switch (expectedType) {
        case "number":

       
          let numArg =
            typeof arg === "number" ? arg : safeEvaluate(arg, context.getCellValue);
          numArg = Number.isNaN(numArg) ? 0 : numArg;
          return isNaN(numArg) ? SHEET_ERRORS.ARGS : numArg;

        case "string":
          return String(arg);

        case "number[]":
          if (Array.isArray(arg)) {
            return arg.map((item) =>
              typeof item === "number" ? item : parseFloat(item as string),
            );
          } else {
            return SHEET_ERRORS.ARGS; 
          }

        case "date":
          const dateArg = typeof arg === "string" ? new Date(arg) : arg;

          if (dateArg instanceof Date && !isNaN(dateArg.getTime())) {
            return dateArg;
          } else {
            return SHEET_ERRORS.ARGS; 
          }

        default:
          return arg;
      }
    });
  }

  static get(name: string) {
    return this.functions[name.toUpperCase()];
  }

  static getFunctionNames() {
    return Object.keys(this.functions);
  }

  static getMetadata(name: string): FormulaMetadata | undefined {
    return this.metadata[name.toUpperCase()];
  }
}

FormulaFunctions.register(
  "SUM",
  (args: number[]) => {
    return args.reduce((sum, val) => sum + val, 0);
  },

  {
    description: "Returns the sum of all provided numbers.",
    args: [
      {
        name: "values",
        type: "number[]",
        description: "List of numbers to sum.",
      },
    ],
    example: "SUM(10, 20, 30) → 60",
  },
);

FormulaFunctions.register(
  "MEAN",
  (args: number[]) => {
    return args.length > 0
      ? args.reduce((sum, val) => sum + val, 0) / args.length
      : 0;
  },
  {
    description: "Calculates the average of the provided numbers.",
    args: [
      { name: "values", type: "number[]", description: "List of numbers." },
    ],
    example: "MEAN(5, 15, 25) → 15",
  },
);

FormulaFunctions.register(
  "META",
  (args: number[]) => {
    return args.length > 0
      ? args.reduce((sum, val) => sum + val, 0) / args.length
      : 0;
  },
  {
    description: "Performs metadata-related calculations (custom logic).",
    args: [
      { name: "values", type: "number[]", description: "List of numbers." },
    ],
    example: "META(4, 8, 12) → 8",
  },
);

FormulaFunctions.register(
  "PRODUCT",
  (args: number[]) => args.reduce((product, val) => product * val, 1),
  {
    description: "Returns the product of all provided numbers.",
    args: [
      {
        name: "values",
        type: "number[]",
        description: "List of numbers to multiply.",
      },
    ],
    example: "PRODUCT(2, 3, 4) → 24",
  },
);

FormulaFunctions.register(
  "POW",
  (args: [number, number]) => {
    const [base, exponent] = args;
    return Math.pow(base, exponent);
  },
  {
    description: "Raises a number to the power of an exponent.",
    args: [
      { name: "base", type: "number", description: "The base number." },
      { name: "exponent", type: "number", description: "The exponent." },
    ],
    example: "POW(2, 3) → 8",
  },
);

FormulaFunctions.register("MAX", (args: number[]) => Math.max(...args), {
  description: "Returns the maximum value from the provided numbers.",
  args: [{ name: "values", type: "number[]", description: "List of numbers." }],
  example: "MAX(4, 7, 1, 9) → 9",
});

FormulaFunctions.register("MIN", (args: number[]) => Math.min(...args), {
  description: "Returns the minimum value from the provided numbers.",
  args: [{ name: "values", type: "number[]", description: "List of numbers." }],
  example: "MIN(4, 7, 1, 9) → 1",
});

FormulaFunctions.register(
  "AVG",
  (args: number[]) => {
    return args.length > 0
      ? args.reduce((sum, val) => sum + val, 0) / args.length
      : 0;
  },
  {
    description: "Calculates the average of the provided numbers.",
    args: [
      { name: "values", type: "number[]", description: "List of numbers." },
    ],
    example: "AVG(10, 20, 30) → 20",
  },
);

FormulaFunctions.register(
  "IF",
  (args: [string, string, string], context?: Context) => {
    const [conditionExpression, trueValue, falseValue] = args;

    if (typeof conditionExpression !== "string")
      return "ERROR: Invalid Condition";
    let safeCondition = conditionExpression.replace(
      /([^=!<>])=([^=])/g,
      "$1==$2",
    );
    safeCondition = safeCondition.replace(/([A-Z]\d+)/g, (match) => {
      const value = context?.getCellValue(match) ?? "0";
      return `"${String(value).toUpperCase()}"`;
    });

    try {
      const parser = new Parser();
      const conditionResult = parser.evaluate(safeCondition);

      return conditionResult ? trueValue : falseValue;
    } catch (err) {
      console.log(err)
      return "ERROR: Invalid Condition";
    }
  },
  {
    description: "Performs conditional logic like Excel's IF formula.",
    args: [
      {
        name: "condition",
        type: "string",
        description: "Condition to evaluate (e.g., A1>5).",
      },
      {
        name: "trueValue",
        type: "any",
        description: "Value if the condition is true.",
      },
      {
        name: "falseValue",
        type: "any",
        description: "Value if the condition is false.",
      },
    ],
    example: 'IF("A1>5", "Yes", "No") → Yes',
  },
);

FormulaFunctions.register("COUNT", (args: string[]|number[]|Date[]) => args.length, {
  description: "Counts the number of provided arguments.",
  args: [
    { name: "values", type: "any[]", description: "List of items to count." },
  ],
  example: "COUNT(1, 'apple', 3) → 3",
});

FormulaFunctions.register("CONCAT", (args: string[]) => args.join(""), {
  description: "Concatenates multiple values into a single string.",
  args: [
    {
      name: "values",
      type: "string[]",
      description: "List of strings to join.",
    },
  ],
  example: "CONCAT('Hello', ' ', 'World') → Hello World",
});

FormulaFunctions.register(
  "TODAY",
  () => {
    const today = new Date();

    return `${String(today.getDate()).padStart(2, "0")}.${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}.${today.getFullYear()}`;
  },
  {
    description: "Returns today's date in DD.MM.YYYY format.",
    args: [],
    example: "TODAY() → 05.02.2025",
  },
);

FormulaFunctions.register(
  "DAY",
  (args: [Date]) => {
    const date1 = args[0];

    return date1.getDate();
  },
  {
    description: "Returns the day of the month from a date.",
    args: [
      {
        name: "date",
        type: "date", // Now specifying 'date' as the type
        description: "Date in a recognizable format.",
      },
    ],
    example: 'DAY("2025-02-05") → 5',
  },
);

FormulaFunctions.register(
  "MONTH",
  (args: [string]) => {
    const date1 = new Date(args[0]);
    if (isNaN(date1.getTime())) return SHEET_ERRORS.ARGS;
    return date1.getMonth() + 1;
  },
  {
    description: "Returns the month (1-12) from a date.",
    args: [
      {
        name: "date",
        type: "string",
        description: "Date in a recognizable format.",
      },
    ],
    example: 'MONTH("2025-02-05") → 2',
  },
);

FormulaFunctions.register(
  "YEAR",
  (args: [string]) => {
    const date1 = new Date(args[0]);
    if (isNaN(date1.getTime())) return SHEET_ERRORS.ARGS;
    return date1.getFullYear();
  },
  {
    description: "Returns the year from a date.",
    args: [
      {
        name: "date",
        type: "string",
        description: "Date in a recognizable format.",
      },
    ],
    example: 'YEAR("2025-02-05") → 2025',
  },
);

FormulaFunctions.register(
  "DATEDIF",
  (args: [string, string]) => {
    const date1 = new Date(args[0]);
    const date2 = new Date(args[1]);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime()))
      return SHEET_ERRORS.ARGS;
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  {
    description: "Calculates the difference in days between two dates.",
    args: [
      { name: "startDate", type: "string", description: "Start date." },
      { name: "endDate", type: "string", description: "End date." },
    ],
    example: 'DATEDIF("2024-01-01", "2024-01-10") → 9',
  },
);

FormulaFunctions.register(
  "DAYS_BETWEEN",
  (args: [string, string]) => {
    const date1 = new Date(args[0]);
    const date2 = new Date(args[1]);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime()))
      return "ERROR: Invalid date(s)";
    return Math.floor(
      (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24),
    );
  },
  {
    description: "Calculates the number of whole days between two dates.",
    args: [
      { name: "startDate", type: "string", description: "Start date." },
      { name: "endDate", type: "string", description: "End date." },
    ],
    example: 'DAYS_BETWEEN("2024-01-01", "2024-01-15") → 14',
  },
);

FormulaFunctions.register(
  "AREA_RECTANGLE",
  (args: [number, number]) => {
    const [width, height] = args;
    return width * height;
  },
  {
    description: "Calculates the area of a rectangle.",
    args: [
      { name: "width", type: "number", description: "The width of the rectangle." },
      { name: "height", type: "number", description: "The height of the rectangle." },
    ],
    example: "AREA_RECTANGLE(5, 10) → 50",
  }
);

FormulaFunctions.register(
  "AREA_CIRCLE",
  (args: [number]) => {
    const [radius] = args;
    return Math.PI * Math.pow(radius, 2);
  },
  {
    description: "Calculates the area of a circle.",
    args: [
      { name: "radius", type: "number", description: "The radius of the circle." },
    ],
    example: "AREA_CIRCLE(7) → 153.938",
  }
);

FormulaFunctions.register(
  "AREA_TRIANGLE",
  (args: [number, number]) => {
    const [base, height] = args;
    return (base * height) / 2;
  },
  {
    description: "Calculates the area of a triangle.",
    args: [
      { name: "base", type: "number", description: "The base of the triangle." },
      { name: "height", type: "number", description: "The height of the triangle." },
    ],
    example: "AREA_TRIANGLE(6, 8) → 24",
  }
);

FormulaFunctions.register(
  "CIRCUMFERENCE",
  (args: [number]) => {
    const [radius] = args;
    return 2 * Math.PI * radius;
  },
  {
    description: "Calculates the circumference of a circle.",
    args: [
      { name: "radius", type: "number", description: "The radius of the circle." },
    ],
    example: "CIRCUMFERENCE(10) → 62.832",
  }
);

FormulaFunctions.register(
  "FACTORIAL",
  (args: [number]) => {
    const [n] = args;
    if (n < 0) return "ERROR: Negative numbers not allowed";
    return n === 0 ? 1 : Array.from({ length: n }, (_, i) => i + 1).reduce((acc, val) => acc * val, 1);
  },
  {
    description: "Calculates the factorial of a number.",
    args: [
      { name: "n", type: "number", description: "The number to calculate factorial for." },
    ],
    example: "FACTORIAL(5) → 120",
  }
);

FormulaFunctions.register(
  "PYTHAGOREAN",
  (args: [number, number]) => {
    const [a, b] = args;
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  },
  {
    description: "Calculates the hypotenuse of a right triangle using the Pythagorean theorem.",
    args: [
      { name: "a", type: "number", description: "One leg of the triangle." },
      { name: "b", type: "number", description: "The other leg of the triangle." },
    ],
    example: "PYTHAGOREAN(3, 4) → 5",
  }
);

FormulaFunctions.register(
  "LOG",
  (args: [number, number]) => {
    const [value, base] = args;
    return Math.log(value) / Math.log(base);
  },
  {
    description: "Calculates the logarithm of a number with a given base.",
    args: [
      { name: "value", type: "number", description: "The number to take the log of." },
      { name: "base", type: "number", description: "The base of the logarithm." },
    ],
    example: "LOG(100, 10) → 2",
  }
);

FormulaFunctions.register(
  "EXP",
  (args: [number]) => {
    const [value] = args;
    return Math.exp(value);
  },
  {
    description: "Calculates the exponential function e^x.",
    args: [
      { name: "value", type: "number", description: "The exponent to raise e to." },
    ],
    example: "EXP(2) → 7.389",
  }
);

FormulaFunctions.register(
  "SIN",
  (args: [number]) => Math.sin(args[0]),
  {
    description: "Calculates the sine of an angle (in radians).",
    args: [{ name: "angle", type: "number", description: "Angle in radians." }],
    example: "SIN(PI/2) → 1",
  }
);

FormulaFunctions.register(
  "COS",
  (args: [number]) => Math.cos(args[0]),
  {
    description: "Calculates the cosine of an angle (in radians).",
    args: [{ name: "angle", type: "number", description: "Angle in radians." }],
    example: "COS(PI) → -1",
  }
);

FormulaFunctions.register(
  "TAN",
  (args: [number]) => Math.tan(args[0]),
  {
    description: "Calculates the tangent of an angle (in radians).",
    args: [{ name: "angle", type: "number", description: "Angle in radians." }],
    example: "TAN(PI/4) → 1",
  }
);


import type { CustomFunction, Macro, Workbook } from "@prisma/client"

export type UserData = {
    id: string,
    name: string|null,
    macros: Macro[],
    workbooks: Workbook[]
    customFunctions: CustomFunction[]
}
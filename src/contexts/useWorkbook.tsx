import React, { createContext, useContext } from "react";
import type { ReactNode}  from "react";
import type { Sheet as SheetModel } from "@prisma/client";

interface Workbook {
  name: string;
  sheets: SheetModel[];
}

interface WorkbookContextType {
  workbook: Workbook | null;
}

const WorkbookContext = createContext<WorkbookContextType | undefined>(undefined);

export const WorkbookProvider: React.FC<{ workbook: Workbook; children: ReactNode }> = ({ workbook, children }) => {
  return (
    <WorkbookContext.Provider value={{ workbook }}>
      {children}
    </WorkbookContext.Provider>
  );
};

export const useWorkbook = (): WorkbookContextType => {
  const context = useContext(WorkbookContext);
  if (!context) {
    throw new Error("useWorkbook must be used within a WorkbookProvider");
  }
  return context;
};

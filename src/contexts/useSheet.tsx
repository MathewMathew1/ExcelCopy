import React, { createContext, useContext, useState } from "react";

interface SheetContextProps {
  currentSheet: string | null;
  cells: Record<string, string | null>;
  handleSave: () => void;
}

const SheetContext = createContext<SheetContextProps | undefined>(undefined);

export const useSheetContext = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("useSheetContext must be used within a SheetProvider");
  }
  return context;
};

export const SheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSheet, setCurrentSheet] = useState<string | null>("Sheet1");
  const [cells, setCells] = useState<Record<string, string | null>>({});

  const handleSave = () => {
    alert("Sheet saved!");
  };

  return (
    <SheetContext.Provider value={{ currentSheet, cells, handleSave }}>
      {children}
    </SheetContext.Provider>
  );
};

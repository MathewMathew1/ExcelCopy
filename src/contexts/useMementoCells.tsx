import { useState, useCallback } from "react";
import { getColumnLetter } from "~/helpers/sheetHelper";

export interface CellData {
  value: string;
  colNum: number;
  rowNum: number;
  sheetId: string;
}

export type CellKey = string;

type CellKeyWithAbc = {
  CellKey: string;
  CellKeyAbc: string;
};

type ChangeRecord = {
  sheetId: string;
  cells: (CellData | null)[];
  keys: CellKeyWithAbc[];
};

export type Change = {
  sheetId: string;
  rowNum: number;
  colNum: number;
  newValue: string | null;
}

export type CellDataMemento = {
  cellData: Record<string, Record<string, CellData | null>>; // { sheetId: { cellKey: CellData | null } }
  updateCellData: (
    changes: Change|Change[]
  ) => void;
  undo: (sheetId: string) => CellKeyWithAbc[] | undefined;
  redo: (sheetId: string) => CellKeyWithAbc[] | undefined;
  setInitialData: (
    data: Record<string, Record<string, CellData | null>>
  ) => void;
  addNewSheet: (data: Record<CellKey, CellData | null>, sheetId: string) => void
};

export function useCellDataMemento(): CellDataMemento {
  const [cellData, setCellData] = useState<
    Record<string, Record<CellKey, CellData | null>>
  >({});
  const [history, setHistory] = useState<Record<string, ChangeRecord[]>>({});
  const [redoStack, setRedoStack] = useState<Record<string, ChangeRecord[]>>(
    {}
  );

  const updateCellData = useCallback((changes: Change|Change[]) => {
    const allChanges = Array.isArray(changes) ? changes : [changes];

    setCellData((prevData) => {
      const newData = { ...prevData };
      const grouped: Record<string, ChangeRecord> = {};

      allChanges.forEach(({ sheetId, rowNum, colNum, newValue }) => {
        if (!newData[sheetId]) newData[sheetId] = {};

        const key = `${sheetId}-${rowNum}-${colNum}`;
        const abc = `${sheetId}!${getColumnLetter(colNum)}${rowNum + 1}`.toUpperCase();

        if (!grouped[sheetId]) {
          grouped[sheetId] = { sheetId, keys: [], cells: [] };
        }

        grouped[sheetId].keys.push({ CellKey: key, CellKeyAbc: abc });
        grouped[sheetId].cells.push(newData[sheetId][key] ?? null);

        if (newValue !== null) {
          newData[sheetId][key] = { value: newValue, colNum, rowNum, sheetId };
        } else {
          delete newData[sheetId][key];
        }
      });

   
      setHistory((prev) => {
        const updated = { ...prev };
        Object.entries(grouped).forEach(([sheetId, record]) => {
          if (!updated[sheetId]) updated[sheetId] = [];
          updated[sheetId] = [...updated[sheetId], record];
        });
        return updated;
      });

      setRedoStack((prev) => {
        const cleared = { ...prev };
        Object.keys(grouped).forEach((sheetId) => {
          cleared[sheetId] = [];
        });
        return cleared;
      });

      return newData;
    });
  }, []);

  const addNewSheet = (data: Record<CellKey, CellData | null>, sheetId: string) => {
    setCellData(prevData => {
      const newData = {...prevData}
      newData[sheetId] = data
      return newData
    })
  }

  const undo = useCallback((sheetId: string) => {
    const last = history[sheetId]?.at(-1);
    if (!last) return;

    setHistory((prev) => {
      const updated = { ...prev };
      updated[sheetId] = prev[sheetId]!.slice(0, -1);
      return updated;
    });

    setRedoStack((prev) => {
      const updated = { ...prev };
      if (!updated[sheetId]) updated[sheetId] = [];
      updated[sheetId] = [
        ...updated[sheetId],
        {
          sheetId,
          keys: last.keys,
          cells: last.keys.map((k) => cellData[sheetId]?.[k.CellKey] ?? null),
        },
      ];
      return updated;
    });

    setCellData((prev) => {
      const updated = { ...prev };
      const sheetData = { ...prev[sheetId] };
      last.keys.forEach((key, i) => {
        const cell = last.cells[i]!;
        if (cell === null) delete sheetData[key.CellKey];
        else sheetData[key.CellKey] = cell;
      });
      updated[sheetId] = sheetData;
      return updated;
    });

    return last.keys;
  }, [history, cellData]);

  const redo = useCallback((sheetId: string) => {
    const last = redoStack[sheetId]?.at(-1);
    if (!last) return;

    setRedoStack((prev) => {
      const updated = { ...prev };
      updated[sheetId] = prev[sheetId]!.slice(0, -1);
      return updated;
    });

    setHistory((prev) => {
      const updated = { ...prev };
      if (!updated[sheetId]) updated[sheetId] = [];
      updated[sheetId] = [
        ...updated[sheetId],
        {
          sheetId,
          keys: last.keys,
          cells: last.keys.map((k) => cellData[sheetId]?.[k.CellKey] ?? null),
        },
      ];
      return updated;
    });

    setCellData((prev) => {
      const updated = { ...prev };
      const sheetData = { ...prev[sheetId] };
      last.keys.forEach((key, i) => {
        const cell = last.cells[i]!;
        if (cell === null) delete sheetData[key.CellKey];
        else sheetData[key.CellKey] = cell;
      });
      updated[sheetId] = sheetData;
      return updated;
    });

    return last.keys;
  }, [redoStack, cellData]);

  const setInitialData = (
    data: Record<string, Record<CellKey, CellData | null>>
  ) => {
    setCellData(data);
  };
  
  return {
    cellData,
    updateCellData,
    undo,
    redo,
    setInitialData,
    addNewSheet
  };
}


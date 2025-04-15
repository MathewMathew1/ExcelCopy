import { useState, useCallback } from "react";
import { getColumnLetter } from "~/helpers/sheetHelper";

export interface CellData {
  value: string;
  colNum: number;
  rowNum: number;
  sheetId: string;
}

type CellKey = string;

type CellKeyWithAbc = {
    CellKey: string, 
    CellKeyAbc: string
}
type ChangeRecord = {
  cells: (CellData | null)[];
  keys: CellKeyWithAbc [];
};

export type CellDataMemento = {
  cellData: Record<string, CellData | null>;
  updateCellData: (
    changes:
      | {
          sheetId: string;
          rowNum: number;
          colNum: number;
          newValue: string | null;
        }
      | {
          sheetId: string;
          rowNum: number;
          colNum: number;
          newValue: string | null;
        }[],
  ) => void;
  undo: () => CellKeyWithAbc[] | undefined
  redo: () => CellKeyWithAbc[] | undefined
  setInitialData: (cellData: Record<string, CellData | null>) => void;
};

export function useCellDataMemento() {
  const [cellData, setCellData] = useState<Record<CellKey, CellData | null>>(
    {},
  );
  const [history, setHistory] = useState<ChangeRecord[]>([]);
  const [redoStack, setRedoStack] = useState<ChangeRecord[]>([]);

  const updateCellData = useCallback(
    (
      changes:
        | {
            sheetId: string;
            rowNum: number;
            colNum: number;
            newValue: string | null;
          }
        | {
            sheetId: string;
            rowNum: number;
            colNum: number;
            newValue: string | null;
          }[],
    ) => {
      const allChanges = Array.isArray(changes) ? changes : [changes];

      setCellData((prevData) => {
        const nextData = { ...prevData };
        const oldCells: (CellData | null)[] = [];
        const keys: CellKeyWithAbc[] = [];

        allChanges.forEach(({ sheetId, rowNum, colNum, newValue }) => {
          const key = `${sheetId}-${rowNum}-${colNum}`;
   
          const cellKey =
      `${sheetId}!${getColumnLetter(colNum)}${rowNum + 1}`.toUpperCase();
          keys.push({CellKey: key, CellKeyAbc: cellKey});
          oldCells.push(prevData[key] ?? null);

          if (newValue !== null) {
            nextData[key] = { value: newValue, colNum, rowNum, sheetId };
          } else {
            delete nextData[key];
          }
        });

        setHistory((prev) => [...prev, { keys, cells: oldCells }]);
        setRedoStack([]); // clear redo
        return nextData;
      });
    },
    [],
  );

  const setInitialData = (cellData: Record<CellKey, CellData | null>) => {
    setCellData(cellData);
  };

  const undo = useCallback(() => {
    const last = history.at(-1);
    if (!last) return;

    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [
      ...prev,
      {
        keys: last.keys,
        cells: last.keys.map((k) => cellData[k.CellKey] ?? null),
      },
    ]);

    setCellData((prev) => {
      const newData = { ...prev };

      last.keys.forEach((key, i) => {
        const cell = last.cells[i]!;
        if (cell === null) delete newData[key.CellKey];
        else newData[key.CellKey] = cell;
      });
      return newData;
    });

    return last.keys;
  }, [history, cellData]);

  const redo = useCallback(() => {
    const last = redoStack.at(-1);
    if (!last) return;

    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [
      ...prev,
      {
        keys: last.keys,
        cells: last.keys.map((k) => cellData[k.CellKey] ?? null),
      },
    ]);

    setCellData((prev) => {
      const newData = { ...prev };
      last.keys.forEach((key, i) => {
        const cell = last.cells[i]!;
        if (cell === null) delete newData[key.CellKey];
        else newData[key.CellKey] = cell;
      });
      return newData;
    });

    return last.keys;
  }, [redoStack, cellData]);

  return {
    cellData,
    updateCellData,
    undo,
    redo,
    setInitialData,
  } as CellDataMemento
}

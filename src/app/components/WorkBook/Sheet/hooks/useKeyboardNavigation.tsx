import { useEffect } from "react";
import { clearCache } from "~/helpers/sheetHelper";
import type { CurrentCell } from "~/types/Cell";
import { useSheet } from "~/types/WorkBook";

type UseKeyboardNavigationProps = {
  currentCell: CurrentCell | null;
  setCurrentCell: React.Dispatch<React.SetStateAction<CurrentCell | null>>;
  cellCache: React.MutableRefObject<Record<string, string | number>>
  cellDependencies: React.MutableRefObject<Record<string, Set<string>>>
};

const useKeyboardNavigation = ({
  currentCell,
  setCurrentCell,
  cellCache,
  cellDependencies
}: UseKeyboardNavigationProps) => {
  const workbook = useSheet();

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        const keys = workbook.cellDataMemento.undo(workbook.currentSheet.id);

        keys?.forEach((key) => {
          clearCache(
            key.CellKeyAbc,
            cellCache.current,
            cellDependencies.current,
          );
        });
      }
      if (e.ctrlKey && e.key === "y") {
        const keys = workbook.cellDataMemento.redo(workbook.currentSheet.id);
        keys?.forEach((key) => {
          clearCache(
            key.CellKeyAbc,
            cellCache.current,
            cellDependencies.current,
          );
        });
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [
    workbook.cellDataMemento.undo,
    workbook.cellDataMemento.redo,
    workbook.cellDataMemento,
    workbook.currentSheet.id
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT"
      ) {
        return;
      }

      if (!currentCell) return;

      let newRow = currentCell.rowNum;
      let newCol = currentCell.colNum;

      switch (e.key) {
        case "ArrowUp":
          newRow = Math.max(currentCell.rowNum - 1, 0);
          break;
        case "ArrowDown":
          newRow = currentCell.rowNum + 1;
          break;
        case "ArrowLeft":
          newCol = Math.max(currentCell.colNum - 1, 0);
          break;
        case "ArrowRight":
          newCol = currentCell.colNum + 1;
          break;
        default:
          return;
      }

      e.preventDefault();

      setCurrentCell({ ...currentCell, rowNum: newRow, colNum: newCol });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCell, setCurrentCell]);
};

export default useKeyboardNavigation;

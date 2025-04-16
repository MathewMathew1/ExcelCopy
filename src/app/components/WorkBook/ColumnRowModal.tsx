import { useState } from "react";
import Button from "../Button";
import Modal from "../Modal";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook"; 
import { MAX_COLS, MAX_ROWS } from "~/helpers/constants";

const ColumnRowModal = ({
  closeResizeModal,
}: {
  closeResizeModal: () => void;
}) => {
  const workbook = useSheet();
  const updateWorkBook = useUpdateWorkBook();
  const currentSheet = workbook.currentSheet;
  const numRows = currentSheet.rowCount;
  const numCols = currentSheet.colCount || 1;

  const [newRows, setNewRows] = useState<number>(numRows);
  const [newCols, setNewCols] = useState<number>(numCols);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChangeSheetSize = async () => {
    setLoading(true);
    await updateWorkBook.changeSheetSize(newRows, newCols);
    setLoading(false);
    closeResizeModal();
  };

  return (

        <Modal onClose={closeResizeModal}>
          <div className="p-4 bg-white w-full shadow-2xl border border-gray-200">
            <h2 className="text-lg font-semibold">Change Sheet Size</h2>
            <div className="mt-4 flex flex-col gap-4">
              <label>
                Rows:
                <input
                  type="number"
                  value={newRows}
                  onChange={(e) =>
                    setNewRows(
                      Math.min(MAX_ROWS, Math.max(1, Number(e.target.value))),
                    )
                  }
                  className="ml-2 w-20 border p-1"
                />
              </label>
              <label>
                Columns:
                <input
                  type="number"
                  value={newCols}
                  onChange={(e) =>
                    setNewCols(
                      Math.min(MAX_COLS, Math.max(1, Number(e.target.value))),
                    )
                  }
                  className="ml-2 w-20 border p-1"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button color="red" onClick={closeResizeModal}>Cancel</Button>
              <Button color="green"
                onClick={() => handleChangeSheetSize()}
                disabled={loading}
              >
                Save
              </Button>
            </div>
          </div>
        </Modal>

  );
};

export default ColumnRowModal;

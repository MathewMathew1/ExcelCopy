import { useUpdateWorkBook } from "./Workbook";
import Button from "../Button";
import Modal from "../Modal";
import { Macro } from "@prisma/client";

const DeleteFunctionModal = ({
  handleClose,
  macro,
}: {
  handleClose: () => void;
  macro?: Macro | null;
}) => {
  const updateWorkbook = useUpdateWorkBook();

  const deleteMacroFunction = async () => {
    if (!macro) return;
    await updateWorkbook.deleteMacroFunc(macro.id);
    handleClose();
  };

  return (
    <>
      {macro && (
        <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Are you sure you want to delete <span className="text-red-500">{macro.name}</span>?
          </h3>
          <div className="flex justify-end gap-4 mt-4 w-full">
            <Button
              color="blue"
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 shadow-md"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              color="red"
              className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 shadow-md"
              onClick={deleteMacroFunction}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      )}
    </>
  );
};

export default DeleteFunctionModal;

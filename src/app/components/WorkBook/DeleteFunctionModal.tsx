import { useUpdateWorkBook } from "~/types/WorkBook"; 
import Button from "../Button";
import type { CustomFunction } from "@prisma/client";

const DeleteFunctionModal = ({
  handleClose,
  customFunction,
}: {
  handleClose: () => void;
  customFunction?: CustomFunction | null;
}) => {
  const updateWorkbook = useUpdateWorkBook();

  const deleteCustomFunctionFunction = async () => {
    if (!customFunction) return;
    await updateWorkbook.deleteCustomFunctionFunc(customFunction.id);
    handleClose();
  };

  return (
    <>
      {customFunction && (
        <div className="absolute  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Are you sure you want to delete <span className="text-red-500">{customFunction.name}</span>?
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
              onClick={deleteCustomFunctionFunction}
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

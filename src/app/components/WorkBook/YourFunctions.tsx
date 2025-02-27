import React, { useState } from "react";
import { useUser } from "~/contexts/useUser";
import Modal from "../Modal";
import Button from "../Button";
import { Macro } from "@prisma/client";
import DeleteFunctionModal from "./DeleteFunctionModal";
import MacroForm from "./MacroForm";

const YourFunctions = ({
  showModal,
  closeModal,
}: {
  showModal: boolean;
  closeModal: () => void;
}) => {
  const useUserData = useUser();
  const [deleteFunctionInfo, setDeleteFunctionInfo] = useState<null | Macro>(
    null,
  );
  const [editMacroInfo, setEditMacroInfo] = useState<null | Macro>(null);

  const handleCloseDeleteFunctionInfo = () => {
    setDeleteFunctionInfo(null);
  };

  const handleCloseEditMacroInfo = () => {
    setEditMacroInfo(null);
  };

  return (
    <>
      {showModal && (
        <Modal onClose={closeModal}>
          <div className="z-50 m-0 flex w-full bg-white p-0 shadow-lg">
            <div className="mb-5 flex w-full flex-col">
              <div className="m-4">
                <h2 className="text-center text-xl font-bold">
                  Your Custom Functions:
                </h2>
              </div>
              <div className="m-4 overflow-auto">
                {useUserData.userData &&
                useUserData.userData.macros.length > 0 ? (
                  <div className="space-y-4">
                    {useUserData.userData.macros.map((macro, index) => (
                      <div
                        key={`${index}-macro`}
                        className="flex items-center justify-between rounded-lg border p-4 shadow-sm transition duration-300 hover:shadow-md"
                      >
                        <div className="text-lg font-medium text-gray-800">
                          {macro.name}
                        </div>
                        <div className="space-x-2">
                          <Button
                            onClick={() => setDeleteFunctionInfo(macro)}
                            color="red"
                            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                          >
                            Delete
                          </Button>
                          <Button
                            onClick={()=>setEditMacroInfo(macro)}
                            color="blue"
                            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-600">
                    You don't have any custom functions. Create one now!
                  </div>
                )}
              </div>
            </div>
          </div>
          {deleteFunctionInfo ? (
            <DeleteFunctionModal
              handleClose={handleCloseDeleteFunctionInfo}
              macro={deleteFunctionInfo}
            />
          ) : null}
          {editMacroInfo ? (
            <div className="absolute z-[500] w-[600px]">
              <MacroForm
                close={handleCloseEditMacroInfo}
                macro={editMacroInfo}
              />
            </div>
          ) : null}
        </Modal>
      )}
    </>
  );
};

export default YourFunctions;

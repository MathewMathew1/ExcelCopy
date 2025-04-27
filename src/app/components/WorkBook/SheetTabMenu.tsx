import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook"; 
import type { ContextMenu } from "./SheetTabs";
import DeleteSheetModal from "./DeleteSheetModal";

const SheetTabMenu = ({
  contextMenu,
  setContextMenu,
  setRenamingSheetId,
  setRenameValue,
}: {
  contextMenu: ContextMenu;
  setContextMenu: Dispatch<SetStateAction<ContextMenu | null>>;
  setRenamingSheetId: Dispatch<SetStateAction<string | null>>;
  setRenameValue: Dispatch<SetStateAction<string>>;
}) => {


  const updateWorkBook = useUpdateWorkBook();
  const workbook = useSheet();
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = async (sheetId: string) => {
    await updateWorkBook.deleteSheetFunc(sheetId);
    setContextMenu(null);
  };

  const handleCopy = async (sheetId: string) => {
    await updateWorkBook.copySheetFunc(sheetId);
    setContextMenu(null);
  };


  const closeDeleteModal = () => {

    setShowDeleteModal(false)
  }
  
  const openDeleteModal = () => {
    setShowDeleteModal(true)
   
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setContextMenu]);

  return (
    <div
    ref={menuRef}
      className="absolute bottom-[100%]  rounded-md border bg-white py-2 text-sm shadow-md"
      style={{
        left: contextMenu.x,
      }}
 
    >
      <button
        className="w-full px-4 py-2 hover:bg-gray-200"
        onClick={() => {
          setRenamingSheetId(contextMenu.sheetId);
          setRenameValue(
            workbook.sheets.find((s) => s.id === contextMenu.sheetId)?.name ?? "",
          );
          setContextMenu(null);
        }}
      >
        Rename
      </button>
      <button
        className="w-full px-4 py-2 hover:bg-gray-200"
        onClick={() => handleCopy(contextMenu.sheetId)}
      >
        Copy
      </button>
      <button
        className="w-full px-4 py-2 hover:bg-red-500 hover:text-white"
        onClick={() => openDeleteModal()}
      >
        Delete
      </button>
      {showDeleteModal? <DeleteSheetModal isOpen={showDeleteModal} handleClose={closeDeleteModal} sheetId={contextMenu.sheetId} deleteFunc={handleDelete} /> : null}
    </div>
  );
};

export default SheetTabMenu;

import React from "react";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook"; 

interface FileDropdownProps {
  handleSave: () => void;
  setShowResizeModal: React.Dispatch<React.SetStateAction<boolean>>
}

const FileDropdown: React.FC<FileDropdownProps> = ({setShowResizeModal}) => {
    const sheet = useSheet()
    const updateWorkBook = useUpdateWorkBook()
    


  return (
    <div className="absolute z-50 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100" onClick={()=>updateWorkBook.handleUpdateSheet(sheet.currentSheet.id)}>
        Save
      </div>
      <div className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100" onClick={()=>updateWorkBook.saveAll()}>
        Save All
      </div>
      <div className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100" onClick={()=>setShowResizeModal(true)}>
        Change Size
      </div>
    
    </div>
  );
};

export default FileDropdown;

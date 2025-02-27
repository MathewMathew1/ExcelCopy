import React, { useState } from "react";
import { useSheet, useUpdateWorkBook } from "./Workbook";
import ColumnRowModal from "./ColumnRowModal";

interface FileDropdownProps {
  handleSave: () => void;
  setShowResizeModal: React.Dispatch<React.SetStateAction<boolean>>
}

const FileDropdown: React.FC<FileDropdownProps> = ({setShowResizeModal}) => {
    const sheet = useSheet()
    const updateWorkBook = useUpdateWorkBook()
    


  return (
    <div className="dropdown">
      <div className="dropdown-item" onClick={()=>updateWorkBook.handleUpdateSheet(sheet.currentSheet.id)}>
        Save
      </div>
      <div className="dropdown-item" onClick={()=>updateWorkBook.saveAll()}>
        Save All
      </div>
      <div className="dropdown-item" onClick={()=>setShowResizeModal(true)}>
        Change Size
      </div>
    
    </div>
  );
};

export default FileDropdown;

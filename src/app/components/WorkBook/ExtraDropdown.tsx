import React from "react";

interface ExtraDropdownProps {
  setShowMacroModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowYourFunctions: React.Dispatch<React.SetStateAction<boolean>>
}

const ExtraDropdown: React.FC<ExtraDropdownProps> = ({setShowMacroModal, setShowYourFunctions}) => {
 

  return (
   <div className="absolute z-50 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100" onClick={()=>setShowMacroModal(true)}>
        Create Function
      </div>
      <div className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100" onClick={()=>setShowYourFunctions(true)}>
        Your Custom Functions
      </div>
    </div>
  );
};

export default ExtraDropdown

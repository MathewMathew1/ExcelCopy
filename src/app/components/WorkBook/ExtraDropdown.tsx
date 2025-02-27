import React from "react";

interface ExtraDropdownProps {
  setShowMacroModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowYourFunctions: React.Dispatch<React.SetStateAction<boolean>>
}

const ExtraDropdown: React.FC<ExtraDropdownProps> = ({setShowMacroModal, setShowYourFunctions}) => {
 

  return (
    <div className="dropdown">
      <div className="dropdown-item" onClick={()=>setShowMacroModal(true)}>
        Create Function
      </div>
      <div className="dropdown-item" onClick={()=>setShowYourFunctions(true)}>
        Your Custom Functions
      </div>
    </div>
  );
};

export default ExtraDropdown

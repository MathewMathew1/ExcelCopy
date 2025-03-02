import React, { useEffect, useRef, useState } from "react";
import FileDropdown from "./FileDropdown";
import ExtraDropdown from "./ExtraDropdown";
import MacroCreateModel from "./MacroCreateModal";
import YourFunctions from "./YourFunctions";
import ColumnRowModal from "./ColumnRowModal";
import { useSheet } from "./Workbook";
import { useCellContext } from "~/contexts/useCellContext";

const SheetMenu = () => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [showYourFunctionsModal, setShowYourFunctionsModal] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const workbook = useSheet();
  const cellContext = useCellContext();

  const closeModal = () => {
    console.log("hhh");
    setShowMacroModal(false);
  };

  const toggleDropdown = (menu: string) => {
    setDropdownOpen((prev) => (prev === menu ? null : menu));
  };

  const handleSave = () => {
    alert("File saved!");
    setDropdownOpen(null); // Close dropdown
  };

  const handleSort = (sortAsc: boolean) => {
    const selectedArea = cellContext.selectedAreas[0];
    if (!selectedArea || cellContext.currentCell?.isCurrentlySelected === true) {
      return;
    }

    const startArea = {
      row: selectedArea.start.rowNum - 1,
      col: selectedArea.start.colNum - 1,
    };

    const endArea = !selectedArea.area
      ? startArea
      : {
          row: selectedArea.start.rowNum + selectedArea.area.sizeY - 2,
          col: selectedArea.start.colNum + selectedArea.area.sizeX - 2, 
        };
        
    cellContext.handleSort({
      sortAscending: sortAsc,
      sheetId: workbook.currentSheet.id,
      start: startArea,
      end: endArea
    });
    setDropdownOpen(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null); // Close dropdown if click is outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div className="menu-bar" ref={dropdownRef}>
      <div className="menu-item" onClick={() => toggleDropdown("file")}>
        File
        {dropdownOpen === "file" && (
          <FileDropdown
            handleSave={handleSave}
            setShowResizeModal={setShowResizeModal}
          />
        )}
      </div>
      <div className="menu-item" onClick={() => toggleDropdown("extra")}>
        Extra
        {dropdownOpen === "extra" ? (
          <ExtraDropdown
            setShowYourFunctions={setShowYourFunctionsModal}
            setShowMacroModal={setShowMacroModal}
          />
        ) : null}
      </div>
      <div className="menu-item" onClick={() => toggleDropdown("view")}>
        Sort
        {dropdownOpen === "view" && (
          <div className="dropdown">
            <div className="dropdown-item" onClick={() => handleSort(true)}>
              Sort Asc
            </div>
            <div onClick={() => handleSort(false)} className="dropdown-item">Sort Desc</div>
          </div>
        )}
      </div>
      <div className="menu-item" onClick={() => toggleDropdown("insert")}>
        Insert
        {dropdownOpen === "insert" && (
          <div className="dropdown">
            <div className="dropdown-item" onClick={() => cellContext.setChartData({showChart: true, chart: null})}>
              Chart
            </div>
          </div>
        )}
      </div>
      <MacroCreateModel showModal={showMacroModal} closeModal={closeModal} />
      <YourFunctions
        showModal={showYourFunctionsModal}
        closeModal={() => setShowYourFunctionsModal(false)}
      />
      {showResizeModal ? (
        <ColumnRowModal closeResizeModal={() => setShowResizeModal(false)} />
      ) : null}
    </div>
  );
};

export default SheetMenu;

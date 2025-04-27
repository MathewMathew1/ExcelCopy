import React, { useEffect, useRef, useState } from "react";
import {
  FiFile,
  FiSliders,
  FiLayers,
  FiZap,
  FiPlusSquare,
} from "react-icons/fi";
import FileDropdown from "./FileDropdown";
import ExtraDropdown from "./ExtraDropdown";
import MacroCreateModel from "./MacroCreateModal";
import YourFunctions from "./YourFunctions";
import ColumnRowModal from "./ColumnRowModal";
import { useSheet, useUpdateWorkBook } from "~/types/WorkBook";
import { useCellContext } from "~/contexts/useCellContext";
import MacroEditor from "./Macro/CreateMacro";
import MacroList from "./Macro/ListOfMacros";

const SheetMenu = () => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [showYourFunctionsModal, setShowYourFunctionsModal] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [showCreateMacro, setShowCreateMacro] = useState(false);
  const [showMacroList, setShowMacroList] = useState(false);
  const [initialMacroText, setInitialMacroText] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  const workbook = useSheet();
  const cellContext = useCellContext();
  const updateWorkBook = useUpdateWorkBook();

  const closeModal = () => setShowMacroModal(false);

  const toggleDropdown = (menu: string) => {
    setDropdownOpen((prev) => (prev === menu ? null : menu));
  };

  const handleSave = () => {
    alert("File saved!");
    setDropdownOpen(null);
  };

  const handleSort = (sortAsc: boolean) => {
    const selectedArea = cellContext.selectedAreas[0];
    if (
      !selectedArea ||
      cellContext.currentCell?.isCurrentlySelected === true
    ) {
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
      end: endArea,
    });
    setDropdownOpen(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!updateWorkBook.isRecording && updateWorkBook.macroSteps.length > 0) {
      setInitialMacroText(updateWorkBook.macroSteps);
      setShowCreateMacro(true);
    }
  }, [updateWorkBook.isRecording]);

  return (
    <div
      className="flex items-center gap-6 rounded-lg bg-white p-4 shadow"
      ref={dropdownRef}
    >
      {/* File */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("file")}
          className="flex items-center gap-2 font-semibold text-gray-700 transition hover:text-black"
        >
          <FiFile />
          File
        </button>
        {dropdownOpen === "file" ? (
          
            <FileDropdown
              handleSave={handleSave}
              setShowResizeModal={setShowResizeModal}
            />
  
        ) : null}
      </div>

      <div className="relative">
        <button
          onClick={() => toggleDropdown("extra")}
          className="flex items-center gap-2 font-semibold text-gray-700 transition hover:text-black"
        >
          <FiLayers />
          Extra
        </button>
        {dropdownOpen === "extra" ? (
         
            <ExtraDropdown
              setShowYourFunctions={setShowYourFunctionsModal}
              setShowMacroModal={setShowMacroModal}
            />
         
        ) : null}
      </div>

      <div className="relative">
        <button
          onClick={() => toggleDropdown("view")}
          className="flex items-center gap-2 font-semibold text-gray-700 transition hover:text-black"
        >
          <FiSliders />
          Sort
        </button>
        {dropdownOpen === "view" ? (
          <div className="absolute z-50 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div
              onClick={() => handleSort(true)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
            >
              Sort Asc
            </div>
            <div
              onClick={() => handleSort(false)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
            >
              Sort Desc
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          onClick={() => toggleDropdown("macro")}
          className="flex items-center gap-2 font-semibold text-gray-700 transition hover:text-black"
        >
          <FiZap />
          Macro
        </button>
        {dropdownOpen === "macro"? (
          <div className="absolute z-50 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div
              onClick={() => setShowCreateMacro(true)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
            >
              Create
            </div>
            <div
              onClick={() => setShowMacroList(true)}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
            >
              Your macros
            </div>
            {updateWorkBook.isRecording ? (
              <div
                onClick={() => updateWorkBook.stopRecording()}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
              >
                Stop Recording
              </div>
            ) : (
              <div
                onClick={() => updateWorkBook.startRecording()}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
              >
                Record
              </div>
            )}
          </div>
        ): null}
      </div>

      {/* Insert */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("insert")}
          className="flex items-center gap-2 font-semibold text-gray-700 transition hover:text-black"
        >
          <FiPlusSquare />
          Insert
        </button>
        {dropdownOpen === "insert" && (
          <div className="absolute z-50 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div
              onClick={() =>
                cellContext.setChartData({ showChart: true, chart: null })
              }
              className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
            >
              Chart
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <MacroCreateModel showModal={showMacroModal} closeModal={closeModal} />
      <YourFunctions
        showModal={showYourFunctionsModal}
        closeModal={() => setShowYourFunctionsModal(false)}
      />
      {showResizeModal && (
        <ColumnRowModal closeResizeModal={() => setShowResizeModal(false)} />
      )}
      {showCreateMacro && (
        <MacroEditor
          onCancel={() => {
            setInitialMacroText("");
            setShowCreateMacro(false);
          }}
          initialText={initialMacroText}
        />
      )}
      {showMacroList && <MacroList onExit={() => setShowMacroList(false)} />}
    </div>
  );
};

export default SheetMenu;

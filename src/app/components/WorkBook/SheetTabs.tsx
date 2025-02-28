import React, { useRef, useState } from "react";
import { useSheet, useUpdateWorkBook } from "./Workbook";
import SheetTabMenu from "./SheetTabMenu";

export type ContextMenu = {
  x: number;
  y: number;
  sheetId: string;
};

const SheetTabs = () => {
  const workbook = useSheet();
  const updateWorkBook = useUpdateWorkBook();

  const [isAdding, setIsAdding] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [renamingSheetId, setRenamingSheetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sheets = workbook.sheets;

  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) return;
    await updateWorkBook.createSheet(newSheetName);

    setNewSheetName("");
    setIsAdding(false);
  };

  const handleSelectionTab = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
  ) => {
    e.preventDefault();
    if (e.button === 0) {
      updateWorkBook.setCurrentSheet(id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, sheetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sheetId });
  };

  const handleRename = async (sheetId: string) => {
    if (!renameValue.trim()) return;
    await updateWorkBook.renameSheetFunc(sheetId, renameValue);
    setRenamingSheetId(null);
    setContextMenu(null);
  };

  return (
    <div className="relative bottom-0 left-0 right-0 flex items-center border-t border-gray-300 bg-gray-100 p-2">
      <div className="flex space-x-2 overflow-x-auto">
        {sheets?.map((sheet) => (
          <React.Fragment key={sheet.id}>
            {renamingSheetId === sheet.id ? (
              <input
                key={`${sheet.id} input`}
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleRename(sheet.id);
                  if (e.key === "Escape") setRenamingSheetId(null);
                }}
                autoFocus
                className="rounded-md border px-2 py-1 outline-none"
              />
            ) : (
              <button
                key={`${sheet.id} button`}
                onContextMenu={(e) => handleContextMenu(e, sheet.id)}
                onMouseDown={(e) => handleSelectionTab(e, sheet.id)}
                className={`rounded-md border px-4 py-2 ${
                  workbook.currentSheet.id === sheet.id
                    ? "bg-blue-500 text-white"
                    : "bg-white"
                }`}
              >
                {sheet.name}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Input field for new sheet */}
        {isAdding ? (
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void  handleCreateSheet();
                if (e.key === "Escape") setIsAdding(false);
              }}
              autoFocus
              className="rounded-md border px-2 py-1 outline-none"
              placeholder="Sheet name"
            />
            <button
              onClick={handleCreateSheet}
              className="rounded-md bg-green-500 px-2 py-1 text-white"
            >
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-md bg-red-500 px-2 py-1 text-white"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="ml-4 rounded-md border bg-green-500 px-3 py-2 text-white"
          >
            ＋
          </button>
        )}
        {contextMenu ? (
          <SheetTabMenu
            setRenameValue={setRenameValue}
            setRenamingSheetId={setRenamingSheetId}
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
          ></SheetTabMenu>
        ) : null}
      </div>
    </div>
  );
};

export default SheetTabs;

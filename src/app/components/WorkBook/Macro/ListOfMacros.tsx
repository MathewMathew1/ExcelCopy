import { useState } from "react";
import Button from "../../Button";
import { useUser } from "~/contexts/useUser";
import { Macro } from "@prisma/client";
import MacroEditor from "./CreateMacro";
import macro from "styled-jsx/macro";
import DeleteMacroModal from "./DeleteMacro";
import { useCellContext } from "~/contexts/useCellContext";

export interface MacroListItem {
  id: string;
  text: string;
  shortcut?: string;
  createdAt: string; 
  updatedAt: string; 
}

const MacroList = ({ onExit }: { onExit: () => void }) => {
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [editedMacro, setEditedMacro] = useState<Macro | null>(null);
  const [deletedMacro, setDeletedMacro] = useState<Macro | null>(null);

  const { userData } = useUser();
  const macros = userData?.macros ?? [];

  const selectedMacro =
    macros.find((macro) => macro.id === selectedMacroId) ?? null;

  const { runMacroScript } = useCellContext();

  return (
    <div className="fixed right-0 top-0 z-[130] flex h-full w-[30rem] flex-col overflow-auto border-l bg-white p-6 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold">Macros</h2>

      <div className="mb-4 max-h-64 overflow-auto rounded-md border">
        {macros.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No macros available</p>
        ) : (
          <ul>
            {macros.map((macro) => (
              <li
                key={macro.id}
                onClick={() => {
                  if (selectedMacroId != macro.id) {
                    setSelectedMacroId(macro.id);
                  } else setSelectedMacroId(null);
                }}
                className={`flex cursor-pointer items-center justify-between border-b p-3 hover:bg-gray-100 ${
                  selectedMacroId === macro.id ? "bg-blue-100" : ""
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{macro.name}</span>
                  {macro.shortcut ? (
                    <span className="text-sm text-gray-500">
                      Ctrl+{macro.shortcut}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button color="black" onClick={() => onExit()}>
          Exit
        </Button>
        <Button
          color="blue"
          onClick={() => selectedMacro && setEditedMacro(selectedMacro)}
          disabled={!selectedMacro}
        >
          Edit
        </Button>
        <Button
          color="green"
          onClick={() => selectedMacro && runMacroScript(selectedMacro.text)}
          disabled={!selectedMacro}
        >
          Run
        </Button>
        <Button
          color="red"
          onClick={() => selectedMacro && setDeletedMacro(selectedMacro)}
          disabled={!selectedMacro}
        >
          Delete
        </Button>
      </div>

      {/* Selected Macro Info */}
      {selectedMacro && (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-700">
          <div>
            <strong>Created At:</strong>{" "}
            {new Date(selectedMacro.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Last Updated:</strong>{" "}
            {new Date(selectedMacro.updatedAt).toLocaleString()}
          </div>
        </div>
      )}
      {editedMacro ? (
        <MacroEditor
          onCancel={() => setEditedMacro(null)}
          macroId={editedMacro.id}
          existingMacro={editedMacro}
          initialText=""
        />
      ) : null}

      <DeleteMacroModal
        handleClose={() => setDeletedMacro(null)}
        macro={deletedMacro}
      />
      <div className="mt-3 flex justify-end p-2">
        <Button color="black" onClick={() => onExit()}>Close</Button>
      </div>
    </div>
  );
};

export default MacroList;

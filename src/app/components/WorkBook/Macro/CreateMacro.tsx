import { useState, useEffect } from "react";
import Button from "../../Button";
import { useUpdateWorkBook } from "~/types/WorkBook";
import Modal from "../../Modal";
import { Macro } from "@prisma/client";
import DocumentationPanel from "./DocumentationMacros";

export interface MacroFormData {
  name: string;
  text: string;
  shortcut?: string;
}

interface MacroEditorProps {
  existingMacro?: Macro | null;
  macroId?: string; // only needed if updating
  onCancel: () => void;
  initialText: string
}

const MacroEditor: React.FC<MacroEditorProps> = ({
  existingMacro,
  macroId,
  onCancel,
  initialText
}) => {
  const [macroData, setMacroData] = useState<MacroFormData>({
    name: "",
    text: initialText,
    shortcut: "",
  });
  const [showDocs, setShowDocs] = useState(false);
  const updateWorkbook = useUpdateWorkBook();

  useEffect(() => {
    if (existingMacro) {
      setMacroData({
        name: existingMacro.name,
        text: existingMacro.text,
        shortcut: existingMacro.shortcut ?? "",
      });
    }
  }, [existingMacro]);

  const handleChange = (field: keyof MacroFormData, value: string) => {
    if (field === "shortcut") {
      // Only allow a single letter shortcut
      value = value.toUpperCase().replace(/[^A-Z]/g, ""); // Remove non-letters and force uppercase

      if (value.length > 1) {
        value = value[0]!; // Only take first character
      }

      if (value) {
        value = `Ctrl+${value}`;
      }
    }

    setMacroData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (macroData.name.trim() === "") {
      alert("Macro name cannot be empty.");
      return;
    }

    if (macroData.text.trim() === "") {
      alert("Macro text cannot be empty.");
      return;
    }

    const payload = {
      ...macroData,
      shortcut: macroData.shortcut?.replace(/^Ctrl\+/, "") ?? undefined, // Send only the single char (backend adds Ctrl+)
    };

    if (macroId) {
      await updateWorkbook.updateMacroFunc(payload, macroId);
    } else {
      await updateWorkbook.createMacroFunc(payload);
    }

    onCancel();
  };

  return (
    <Modal onClose={onCancel}>
      {!showDocs ? (
        <div className="m-2 flex w-[70%] flex-1 flex-col bg-yellow-50 p-4">
          <h2 className="mb-4 border-b pb-2 text-lg font-semibold">
            {existingMacro ? "Edit Macro" : "Create Macro"}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Macro Name
            </label>
            <input
              type="text"
              value={macroData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Macro name"
              className="mt-1 w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Macro Text
            </label>
            <textarea
              rows={13}
              value={macroData.text}
              onChange={(e) => handleChange("text", e.target.value)}
              placeholder="Enter macro text"
              className="mb-4 mt-1 h-full w-full resize-none overflow-auto whitespace-nowrap rounded-md border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-4 mt-5">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Shortcut (optional, one letter A-Z)
            </label>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700">Ctrl +</span>
              <input
                type="text"
                value={macroData.shortcut?.replace(/^Ctrl\+/, "") ?? ""}
                onChange={(e) => handleChange("shortcut", e.target.value)}
                placeholder="M"
                maxLength={1}
                className="w-12 rounded-md border-gray-300 p-2 text-center shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-4 border-t pt-4">
            <Button color="red" onClick={onCancel}>
              Cancel
            </Button>
            <Button color="green" onClick={handleSave}>
              Save
            </Button>
            <Button color="blue" onClick={() => setShowDocs((prev) => !prev)}>
              {showDocs ? "Hide Documentation" : "Show Documentation"}
            </Button>
          </div>
        </div>
      ) : (
        <DocumentationPanel goBackFn={()=>setShowDocs(false)}/>
      )}
    </Modal>
  );
};

export default MacroEditor;

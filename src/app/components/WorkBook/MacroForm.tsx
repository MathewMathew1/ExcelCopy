import React, { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import type { Macro } from "@prisma/client";
import { useUpdateToast } from "~/contexts/useToast";
import { severityColors } from "~/types/Toast";
import Button from "../Button";
import { ArgType } from "@prisma/client";

interface MacroFormProps {
  macro?: Macro | null;
  onSuccess?: () => void;
  close: () => void;
}

const MacroForm: React.FC<MacroFormProps> = ({ macro, onSuccess, close }) => {
  const [name, setName] = useState(macro?.name ?? "");
  const [description, setDescription] = useState(macro?.description ?? "");
  const [code, setCode] = useState(macro?.code ?? "");
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const [args, setArgs] = useState<
    { name: string; type: ArgType; description: string }[]
  >(macro?.args ?? []);
  const [testArgs, setTestArgs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const trpcUtils = api.useUtils();

  const updateToast = useUpdateToast();

  useEffect(() => {
    if (macro) {
      setName(macro.name);
      setDescription(macro.description ?? "");
      setCode(macro.code);
    } else {
      setName("");
      setDescription("");
      setCode("");
    }
  }, [macro]);

  const createMacro = api.macro.create.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "created function successfully",
        severity: severityColors.success,
      });
      if (onSuccess) onSuccess();
      clearForm();

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          macros: [...oldData.macros, data],
        };
      });

      close();
    },
    onError: () => {
      updateToast.addToast({
        toastText: "failed to create function successfully",
        severity: severityColors.error,
      });
    },
  });

  // Edit Macro Mutation
  const updateMacro = api.macro.edit.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "updated function successfully",
        severity: severityColors.success,
      });
      if (onSuccess) onSuccess();

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          macros: [
            ...oldData.macros.filter((macro) => macro.id !== data.id),
            data,
          ],
        };
      });
      close();
    },
    onError: () => {
      updateToast.addToast({
        toastText: "failed to update function successfully",
        severity: severityColors.error,
      });
    },
  });

  const clearForm = () => {
    setName("");
    setDescription("");
    setCode("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; code?: string } = {};
    if (name.trim() === "") newErrors.name = "Macro name is required.";
    if (code.trim() === "") newErrors.code = "Macro code is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (macro) {
      updateMacro.mutate({ id: macro.id, name, description, code, args });
    } else {
      createMacro.mutate({ name, description, code, args });
    }
  };

  const handleAddArg = () => {
    setArgs([...args, { name: "", type: ArgType.STRING, description: "" }]);
  };

  const handleArgChange = (
    index: number,
    key: keyof (typeof args)[0],
    value: ArgType,
  ) => {
    const updatedArgs = [...args];
    updatedArgs[index]![key] = value;
    setArgs(updatedArgs);
  };

  const handleRemoveArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };



  const handleTestArgChange = (index: number, value: string) => {
    const updated = [...testArgs];
    updated[index] = value;
    setTestArgs(updated);
  };

  const handleTestMacroSecure = () => {
    try {
      setTestError(null);
      setTestResult(null);
  
      const c = new Compartment({
        Math: harden(Math),
        Number: harden(Number),
        parseInt: harden(parseInt),
        parseFloat: harden(parseFloat),
        console: harden(console),
      });
  
      // Evaluate the code into a function
      const func = c.evaluate(`(${code})`);
  
      if (typeof func === "function") {
        // Parse each argument based on its type (simple parse)
        const parsedArgs = testArgs.map((arg, i) => {
          try {
            return JSON.parse(arg); // Try to parse as JSON
          } catch {
            return arg; // Fallback to string
          }
        });
  
        const value = func(...parsedArgs);
  
        if (typeof value === "string" || typeof value === "number") {
          setTestResult(String(value));
        } else {
          setTestResult("0");
        }
      } else {
        setTestError("ERROR: Invalid macro function");
      }
    } catch (err: any) {
      setTestError(err.message || "Unknown error");
    }
  };
  
  

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-4 rounded-md border bg-white p-4 shadow-lg overflow-auto"
    >
      <h2 className="text-xl font-bold">
        {macro ? "Edit Function" : "Create New Function"}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Macro Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-md border p-2 focus:outline-none focus:ring-2 ${
            errors.name
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Function Code (JavaScript)
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={6}
          placeholder={`function customMacro(cellData) {\n  return cellData * 2;\n}`}
          className={`w-full rounded-md border p-2 font-mono focus:outline-none focus:ring-2 ${
            errors.code
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {errors.code && (
          <p className="mt-1 text-sm text-red-500">{errors.code}</p>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-lg font-medium text-gray-700">Arguments</h3>
        {args.map((arg, index) => (
          <div key={index} className="mb-2 flex items-center gap-2">
            {/* Arg Name */}
            <input
              type="text"
              placeholder="Arg Name"
              value={arg.name}
              onChange={(e) =>
                handleArgChange(index, "name", e.target.value as ArgType)
              }
              className="w-1/4 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-blue-500"
            />
            {/* Arg Type */}
            <select
              value={arg.type}
              onChange={(e) =>
                handleArgChange(index, "type", e.target.value as ArgType)
              }
              className="w-1/4 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-blue-500"
            >
              {Object.values(ArgType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {/* Arg Description */}
            <input
              type="text"
              placeholder="Description (Optional)"
              value={arg.description}
              onChange={(e) =>
                handleArgChange(index, "description", e.target.value as ArgType)
              }
              className="w-2/4 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-blue-500"
            />
            {/* Remove Arg Button */}
            <Button
              color="red"
              onClick={() => handleRemoveArg(index)}
              className="p-2"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          color="blue"
          onClick={(e) => {
            e.preventDefault();
            handleAddArg();
          }}
          className="mt-2"
        >
          Add Argument
        </Button>
      </div>
      <div className="flex justify-end gap-1">
        <Button
          color="green"
          type="submit"
          className="rounded-md p-2 text-white disabled:bg-gray-400"
          disabled={createMacro.isPending || updateMacro.isPending}
        >
          {macro ? "Update Macro" : "Create Macro"}
        </Button>
        <Button
          color="blue"
          onClick={(e) => {
            e.preventDefault();
            close();
          }}
        >
          Cancel
        </Button>
        </div>
        <div className="flex flex-col">

        <h3 className="mt-4 text-lg font-medium text-gray-700">
          Test Function
        </h3>

        <div className="space-y-2">
          {args.map((arg, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-600">
                {arg.name || `Argument ${index + 1}`} ({arg.type})
              </label>
              <input
                type="text"
                placeholder={`Enter value for ${arg.name}`}
                value={testArgs[index] ?? ""}
                onChange={(e) => handleTestArgChange(index, e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex justify-end">
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleTestMacroSecure();
            }}
            color="blue"
          >
            Run Test
          </Button>
          </div>
          {testResult !== null && (
            <div className="rounded-md border p-2 text-sm">
              <strong>Result:</strong> {testResult}
            </div>
          )}

          {testError && (
            <div className="rounded-md border border-red-500 bg-red-100 p-2 text-sm text-red-700">
              <strong>Error:</strong> {testError}
            </div>
          )}
        
        </div>
      </div>
    </form>
  );
};

export default MacroForm;

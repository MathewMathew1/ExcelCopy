"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import Button from "../components/Button";

import { useUpdateToast } from "~/contexts/useToast";
import { severityColors } from "~/types/Toast";
import { useRouter } from "next/navigation";

const CreateWorkbookForm = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const updateToast = useUpdateToast();

  const createWorkbook = api.workbook.create.useMutation({
    onSuccess: (data) => {
      setLoading(false);
      console.log(data)
      updateToast.addToast({
        toastText: "Workbook created successfully!",
        severity: severityColors.success,
      });
      
      router.push(`/spreadsheet/${data.id}`);
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to create workbook.",
        severity: severityColors.error,
      });
      setLoading(false);
    },
  });

  const handleCreateWorkbook = (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    createWorkbook.mutate({ name });
  };

  return (
    <div className="glass p-4 h-min mt-4 ">
      <form onSubmit={handleCreateWorkbook} className="space-y-4">
        <div>
          <label htmlFor="workbookName" className="block ">
            Workbook Name
          </label>
          <input
            id="workbookName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter workbook name"
            className="default-input"
            required
          />
        </div>
        <Button color="blue" small={false} type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Workbook"}
        </Button>
      </form>
    </div>
  );
};

export default CreateWorkbookForm;

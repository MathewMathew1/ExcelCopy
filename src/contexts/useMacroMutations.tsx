import { api } from "~/trpc/react";
import { severityColors } from "~/types/Toast";
import { useUpdateToast } from "./useToast";
import { MacroFormData } from "~/app/components/WorkBook/Macro/CreateMacro";

export const useMacroMutations = () => {
  const updateToast = useUpdateToast();

  const trpcUtils = api.useUtils();

  const createMacroMutation = api.macro.create.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Created macro",
        severity: severityColors.success,
      });

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          macros: [...oldData.macros, data],
        };
      });
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to create macro",
        severity: severityColors.error,
      });
    },
  });

  const deleteMacroMutation = api.macro.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted macro",
        severity: severityColors.success,
      });

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          macros: oldData.macros.filter(macro => macro.id != data.macroId),
        };
      });
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to delete macro",
        severity: severityColors.error,
      });
    },
  });

  const updateMacroMutation = api.macro.update.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Updated macro",
        severity: severityColors.success,
      });

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        const index = oldData.macros.findIndex(macro => macro.id == data.id)
        oldData.macros[index] = data

        return {
          ...oldData,  
        };
      });
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to update macro",
        severity: severityColors.error,
      });
    },
  });

  const createMacroFunc = async (macro: MacroFormData) => {
    await createMacroMutation.mutateAsync(macro);
  };

  const updateMacroFunc = async (macro: MacroFormData, macroId: string) => {
     await updateMacroMutation.mutateAsync({ macroId, ...macro });
  };

  const deleteMacroFunc = async (macroId: string) => {
    await deleteMacroMutation.mutateAsync({ macroId});
 };

  return {
    createMacroFunc,
    updateMacroFunc,
    deleteMacroFunc
  };
};

import { api } from "~/trpc/react";
import { severityColors } from "~/types/Toast";
import { useUpdateToast } from "./useToast";

export const useMacroMutations = () => {
  const trpcUtils = api.useUtils();

  const updateToast = useUpdateToast();

  const deleteMacro = api.macro.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted macro successfully",
        severity: severityColors.success,
      });

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          macros: oldData.macros.filter((macro) => macro.id !== data),
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

  

  const deleteMacroFunc = async (macroId: string) => {
    await deleteMacro.mutateAsync({
      id: macroId,
    });
  };

  return { deleteMacro, deleteMacroFunc };
};

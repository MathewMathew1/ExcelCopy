import { api } from "~/trpc/react";
import { severityColors } from "~/types/Toast";
import { useUpdateToast } from "./useToast";

export const useCustomFunctionsMutations = () => {
  const trpcUtils = api.useUtils();

  const updateToast = useUpdateToast();

  const deleteMacro = api.customFunction.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted macro successfully",
        severity: severityColors.success,
      });

      trpcUtils.user.getData.setData(undefined, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          customFunctions: oldData.customFunctions.filter((cFn) => cFn.id !== data),
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

  

  const deleteCustomFunctionFunc = async (macroId: string) => {
    await deleteMacro.mutateAsync({
      id: macroId,
    });
  };

  return { deleteMacro, deleteCustomFunctionFunc };
};

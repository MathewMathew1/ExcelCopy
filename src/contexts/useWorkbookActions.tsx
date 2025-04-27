type useSheetActionsProps = {
  copySheetFunc: (sheetId: string) => Promise<void>;
  addMacroStep: (step: string) => void;
};

const useWorkbookActions = ({
  copySheetFunc,
  addMacroStep,
}: useSheetActionsProps) => {
  const copySheetFuncAction = async (sheetId: string) => {
    const command = `COPY_SHEET`;

    addMacroStep(command);
    return await copySheetFunc(sheetId);
  };

  return {
    copySheetFunc: copySheetFuncAction,
  };
};

export default useWorkbookActions;

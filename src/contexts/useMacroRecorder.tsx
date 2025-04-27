import { useState, useRef, useCallback } from "react";

const useMacroRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const macroSteps = useRef<string>("");

  const startRecording = useCallback(() => {
    setIsRecording(true);
    macroSteps.current = ""; 
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const addMacroStep = useCallback((step: string) => {
    if (isRecording) {
      macroSteps.current += step + '\n'
    }
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    addMacroStep,
    macroSteps: macroSteps.current,
  };
};

export default useMacroRecorder;

import React, {
  useState,
  useEffect,
  ReactElement,
  cloneElement,
  useRef,
} from "react";
import { FormulaFunctions } from "~/helpers/formulasSheet";
import { createPortal } from "react-dom";

interface SuggestionFormulaListProps {
  value: string;
  onChange: (newValue: string) => void;
  children: ReactElement;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}

const SuggestionFormulaList: React.FC<SuggestionFormulaListProps> = ({
  value,
  onChange,
  children,
  handleKeyPress,
  inputRef,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [currentFunction, setCurrentFunction] = useState<string | null>(null);
  const [currentArgIndex, setCurrentArgIndex] = useState<number>(0);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(
    null,
  );

  const [isFocused, setIsFocused] = useState(false);

  const calculateCurrentArgIndex = (
    cursorPosition: number,
    argsString: string,
  ) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const openParenIndex = textBeforeCursor.lastIndexOf("(");

    if (openParenIndex === -1) {
      return -1;
    }

    const argsSection = textBeforeCursor.substring(openParenIndex + 1);
    const relativePosition = cursorPosition - openParenIndex - 1;
    const args = argsSection.split(";").map((arg) => arg.trim());

    let totalLength = 0;

    for (let i = 0; i < args.length; i++) {
      totalLength += args[i]!.length + 1;
      if (relativePosition < totalLength) {
        return i;
      }
    }
    return args.length - 1;
  };

  const getLastWordBeforeCursor = (
    value: string,
    cursorPosition: number,
  ): string | null => {
    const regex = /([A-Za-z_]+)(?=\s*(\(|$))/g;

    const textBeforeCursor = value.slice(0, cursorPosition);

    let match: RegExpExecArray | null;
    let lastMatch: string | null | undefined = null;
    let lastMatchEndIndex = -1;

    while ((match = regex.exec(textBeforeCursor)) !== null) {
      const matchEndIndex = match.index + match[0].length;
      if (matchEndIndex === cursorPosition) {
        lastMatch = match[1];
        lastMatchEndIndex = matchEndIndex;
      }
    }

    const charAfterCursor = value[cursorPosition] || "";

    if (
      lastMatch &&
      lastMatchEndIndex === cursorPosition &&
      !/[A-Za-z(]/.test(charAfterCursor)
    ) {
      return lastMatch;
    }

    return null;
  };

  const getEnclosingFunctionName = (
    value: string,
    cursorPosition: number,
  ): string | null | undefined => {
    const openParenIndex = value.lastIndexOf("(", cursorPosition);
    if (openParenIndex === -1) return null;

    const textBeforeParen = value.slice(0, openParenIndex);
    const funcMatch = textBeforeParen.match(/([A-Za-z_]+)\s*$/);

    if (funcMatch) {
      const functionName = funcMatch[1];

      const closeParenIndex = value.indexOf(")", openParenIndex);
      const insideParentheses =
        (closeParenIndex === -1 && cursorPosition > openParenIndex) ||
        (cursorPosition > openParenIndex &&
          cursorPosition < closeParenIndex + 1);

      if (insideParentheses) {
        return functionName;
      }
    }

    return null;
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener("selectionchange", setupSuggestions);
      return () => {
        inputRef.current?.removeEventListener(
          "selectionchange",
          setupSuggestions,
        );
      };
    }
  }, [value]);

  const setupSuggestions = () => {
    const cursorPosition = inputRef.current?.selectionStart ?? 0;

    if (value.startsWith("=")) {
      const enclosingFunction = getEnclosingFunctionName(value, cursorPosition);

      if (enclosingFunction) {
        const openParenIndex = value.lastIndexOf("(", cursorPosition);
        const argsString = value.slice(openParenIndex + 1, cursorPosition);
        const argIndex = calculateCurrentArgIndex(cursorPosition, argsString);

        setCurrentFunction(enclosingFunction.toUpperCase());
        setCurrentArgIndex(argIndex);
        setSuggestions([]);
      } else {
        const functionName = getLastWordBeforeCursor(value, cursorPosition);
        if (functionName) {
          const availableSuggestions =
            FormulaFunctions.getFunctionNames().filter((func) =>
              func.toUpperCase().startsWith(functionName.toUpperCase()),
            );
          setCurrentFunction(null);
          setSuggestions(availableSuggestions);
        } else {
          setCurrentFunction(null);
          setSuggestions([]);
        }
      }
    } else {
      setCurrentFunction(null);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSuggestionClick(suggestions[highlightedIndex]!);
      } else if (e.key === "Escape") {
        setSuggestions([]);
      }
    } else {
      handleKeyPress(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const cursorPosition = inputRef.current?.selectionStart ?? 0;

    const functionName = getLastWordBeforeCursor(value, cursorPosition);

    if (functionName) {
      const functionNameLength = functionName.length;
      const addedTextLength = suggestion.length + 1;

      const newValue =
        value.slice(0, value.lastIndexOf(functionName)) +
        suggestion +
        "(" +
        value.slice(cursorPosition);

      const newCursorPosition =
        cursorPosition + addedTextLength - functionNameLength;

      onChange(newValue);

      setTimeout(() => {
        const newCursorPosition =
          cursorPosition + addedTextLength - functionNameLength;

        inputRef.current?.setSelectionRange(
          newCursorPosition,
          newCursorPosition,
        );
      }, 0);

      setSuggestions([]);
      setCurrentFunction(suggestion);
      setCurrentArgIndex(0);
    }
  };

  const a = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
  };

  return (
    <div className="relative z-[100] h-full">
      {cloneElement(children, {
        value,
        onChange: a,
        onKeyDown: handleKeyDown,
        ref: inputRef,
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
      })}

      {isFocused &&
        suggestions.length > 0 &&
        createPortal(
          <ul
            className="absolute z-[1000] mt-1 w-fit min-w-[250px] rounded border bg-slate-50 text-left shadow-lg"
            style={{
              top: inputRef.current?.getBoundingClientRect().bottom + "px",
              left: inputRef.current?.getBoundingClientRect().left + "px",
              position: "fixed",
            }}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className={`relative cursor-pointer p-2 ${
                  highlightedIndex === index
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-200"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                onMouseEnter={() => setHoveredSuggestion(suggestion)}
                onMouseLeave={() => setHoveredSuggestion(null)}
              >
                {suggestion}
                {hoveredSuggestion === suggestion && (
                  <div className="absolute left-full top-0 ml-2 w-48 rounded border bg-gray-100 p-2 text-sm text-gray-700 shadow-md">
                    {FormulaFunctions.getMetadata(suggestion)?.description}
                  </div>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )}
      {isFocused ? (
        <RenderArgumentHints
          inputRef={inputRef}
          currentFunction={currentFunction}
          currentArgIndex={currentArgIndex}
        />
      ) : null}
    </div>
  );
};

const RenderArgumentHints = ({
  currentFunction,
  currentArgIndex,
  inputRef
}: {
  currentFunction?: string | null;
  currentArgIndex: number;
  inputRef: React.MutableRefObject<HTMLInputElement | null>
}) => {
  if (currentFunction) {
    const metadata = FormulaFunctions.getMetadata(currentFunction);

    const numberOfElements: number = metadata ? metadata.args.length - 1 : 0;

    currentArgIndex = Math.min(numberOfElements, currentArgIndex);
    if (metadata && metadata.args) {
      return createPortal(
        <div className="absolute z-50 mt-1 rounded border bg-gray-50 p-2 text-sm shadow-lg" style={{
          top: inputRef.current?.getBoundingClientRect().bottom + "px",
          left: inputRef.current?.getBoundingClientRect().left + "px",
          position: "fixed",
        }}>
          <strong>{currentFunction}</strong>(
          {metadata.args.map((arg: any, index: number) => (
            <span
              key={index}
              className={`${
                index === currentArgIndex
                  ? "font-bold text-blue-500"
                  : "text-gray-700"
              }`}
              title={arg.description}
            >
              {arg.name}: <em>{arg.type}</em>
              {index < metadata.args.length - 1 ? ", " : ""}
            </span>
          ))}
          )
        </div>,
        document.body,
      );
    }
  }
  return null;
};

export default SuggestionFormulaList;

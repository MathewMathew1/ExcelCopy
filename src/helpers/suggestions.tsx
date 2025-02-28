export const calculateCurrentArgIndex = (
  cursorPosition: number,
  value: string,
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

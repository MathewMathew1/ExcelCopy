export function parseArgs(line: string): { command: string; args: Record<string, string | boolean> } {
    const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    const command = parts.shift()?.toUpperCase() ?? "";
  
    const args: Record<string, string | boolean> = {  };
    let currentFlag: string | null = null;
  
    for (const part of parts) {
      if (part.startsWith("-")) {
        currentFlag = part.replace(/^-+/, "");
        args[currentFlag] = true; 
      } else if (currentFlag) {
        args[currentFlag] = part.replace(/^"|"$/g, "");
        currentFlag = null;
      }
    }
  
    return { command, args };
  }
  
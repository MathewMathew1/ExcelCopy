export function parseCellRef(cellRef: string): { row: number; col: number } {
    const match = cellRef.match(/^([A-Z]+)(\d+)$/i);
    if (!match) throw new Error(`Invalid cell reference: ${cellRef}`);
    const [, colStr, rowStr] = match;

    if(!colStr || !rowStr) throw new Error(`Invalid cell reference: ${cellRef}`)
    const col = colStr.toUpperCase().split('').reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;
    const row = parseInt(rowStr, 10) - 1;
    return { row, col };
  }
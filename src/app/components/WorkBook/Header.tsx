import type { VirtualizedHeaderStyle } from "@mathewmathew1/virtualized-list";
import { getColumnLabel } from "~/helpers/column";

export const HeaderTop = ({
  style,
  columnIndex,
}: {
  style: VirtualizedHeaderStyle;
  columnIndex: number;
}) => {
    return <div
      key={`col${columnIndex}`}
      className="h-[25px] flex-shrink-0 border-r border-gray-500 text-center z-50 bg-gray-200"
      style={{ ...style }}
    >
      {getColumnLabel(columnIndex)}
    </div>
}


export const HeaderLeft = ({
  style,
  columnIndex,
}: {
  style: VirtualizedHeaderStyle;
  columnIndex: number;
}) => {
    return <div
      key={`col${columnIndex}`}
      className="border-box h-[25px] flex-shrink-0 border-b border-gray-500 text-center z-50 bg-gray-200"
      style={{ ...style }}
    >
      {columnIndex+1}
    </div>
}

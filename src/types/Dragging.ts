export type Dragging = {
    start: {
        rowNum: number;
        colNum: number;
    } | null;
    end: {
        rowNum: number;
        colNum: number;
    } | null;
}
// Helper functions to turn anything into a masonry grid.

export type SortingHeuristic = "height";

export type MasonryElement<T> = {
  id: string | number | Symbol;
  content: T;
  height: number;
};

export type Column<T> = {
  index: number;
  width: number;
  content: MasonryElement<T>[];
  currentHeight: number;
  x: number;
};

export type MasonryOpts = {
  canvasWidth?: number;
  columnWidth?: number;
  horizontalPadding?: number;
  gap?: number;
};

export type InsertedPosition = {
  columnId: number;
  itemId: number;
  startHeight: number;
  x: number;
};

export class Masonry<T> {
  canvasWidth: number;
  columnWidth: number;
  horizontalPadding: number;
  gap: number;
  columns: Column<T>[];
  maxHeight = 0;

  constructor(opts: MasonryOpts) {
    const { canvasWidth = 1200, columnWidth = 300, horizontalPadding = 16, gap = 32 } = opts;
    this.canvasWidth = canvasWidth;
    this.columnWidth = columnWidth;
    this.horizontalPadding = horizontalPadding;
    this.gap = gap;
    this.columns = this.createColumns();
  }

  createColumns() {
    const columns: Column<T>[] = [];

    let index = 0;
    for (
      let i = this.horizontalPadding;
      i < this.canvasWidth - this.horizontalPadding - this.columnWidth;
      i += this.columnWidth + this.gap
    ) {
      columns.push({ index, width: this.columnWidth, content: [], currentHeight: 0, x: i });
      index++;
    }

    if (columns.length === 0)
      throw new Error("Tried to construct an empty Masonry layout. Aborted.");
    return columns;
  }

  insertElement(element: MasonryElement<T>): InsertedPosition {
    this.sortColumns(this.columns);
    const col = this.columns[0];
    col.content.push(element);
    col.currentHeight += element.height;
    this.maxHeight = Math.max(this.maxHeight, col.currentHeight);

    return {
      columnId: col.index,
      itemId: col.content.length - 1,
      startHeight: col.currentHeight - element.height,
      x: col.x,
    };
  }

  sortColumns(columns: Column<T>[], heuristic: SortingHeuristic = "height") {
    if (heuristic === "height") {
      return this.sortColumnsByHeight(columns);
    }
  }

  sortColumnsByHeight(columns: Column<T>[]) {
    columns.sort((a, b) => a.currentHeight - b.currentHeight);
  }

  sortColumnsByNumItems(columns: Column<T>[]) {
    columns.sort((a, b) => a.content.length - b.content.length);
  }
}

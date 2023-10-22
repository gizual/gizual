export type SortingHeuristic = "height";

export type MasonryElement<T> = {
  id: string;
  content: T;
  height: number;
};

export type PositionedMasonryElement<T> = MasonryElement<T> & {
  y: number;
};

export type Column<T> = {
  index: number;
  width: number;
  content: PositionedMasonryElement<T>[];
  currentHeight: number;
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
    const { canvasWidth = 1200, columnWidth = 300, horizontalPadding = 16, gap = 16 } = opts;
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
      columns.push({ index, width: this.columnWidth, content: [], currentHeight: 0 });
      index++;
    }

    if (columns.length === 0) return [];
    return columns;
  }

  insertElement(element: MasonryElement<T>) {
    if (this.columns.length === 0) {
      return;
    }

    this.sortColumns();
    const col = this.columns[0];
    const positionedElement: PositionedMasonryElement<T> = { ...element, y: col.currentHeight };
    col.content.push(positionedElement);
    col.currentHeight += element.height + this.gap;
    this.maxHeight = Math.max(this.maxHeight, col.currentHeight);

    this.sortItems();
  }

  sortColumns(heuristic: SortingHeuristic = "height") {
    if (heuristic === "height") {
      return this.sortColumnsByHeight();
    }
  }

  sortColumnsByHeight() {
    this.columns.sort((a, b) => a.currentHeight - b.currentHeight);
  }

  sortColumnsByNumItems() {
    this.columns.sort((a, b) => a.content.length - b.content.length);
  }

  sortItems() {
    for (const column of this.columns) this.sortItemsByIndex(column);
  }

  sortItemsByIndex(column: Column<T>) {
    column.content.sort((a, b) => a.id.localeCompare(b.id));

    let currentY = 0;
    for (const item of column.content) {
      item.y = currentY;
      currentY += item.height;
    }
  }

  // Rebuild the entire grid by sorting all children before inserting them.
  sortAndPack() {
    const newColumns = this.createColumns();
    const children: MasonryElement<T>[] = [];
    for (const col of this.columns) {
      for (const child of col.content) {
        children.push(child);
      }
    }
    children.sort((a, b) => b.height - a.height);

    this.columns = newColumns;
    for (const child of children) {
      this.insertElement(child);
    }
  }
}

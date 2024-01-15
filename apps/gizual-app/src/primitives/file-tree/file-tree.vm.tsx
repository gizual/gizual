import { action, makeObservable, observable } from "mobx";
import { match } from "ts-pattern";

export type FileTreeMode = "full" | "favorites";
export type FileKind = "file" | "folder" | string;
export type FileTreeFlatItem = {
  path: string[];
  kind: FileKind;
};

export enum CheckboxState {
  CHECKED = "checked",
  INDETERMINATE = "indeterminate",
  UNCHECKED = "unchecked",
}

export type FileTreeNode = {
  checked: CheckboxState;
  path: string[];
  kind: FileKind;
  children: FileTreeNode[];
  parentPath: string[];
};

export class FileTreeViewModel {
  /* List of all available files we could render. */
  private _availableFiles: FileTreeFlatItem[];

  /**
    Map of keys to store references to nodes.
    The root element is stored at key "".
  */
  private _nodes: { [key: string]: FileTreeNode } = {};

  /* Root of the constructed tree. */
  private _root: FileTreeNode | undefined;

  constructor(availableFiles: FileTreeFlatItem[]) {
    this._availableFiles = availableFiles;
    this.constructTree();
    makeObservable(this, undefined, { autoBind: true });
  }

  /**
   * Transform the flat array of input files into a nested tree structure.
   * Assumption: The input files are pre-sorted by path, such that all parent
   * elements of a given file are present in the array before the file itself.
   */
  private constructTree() {
    const root: FileTreeNode = {
      checked: CheckboxState.UNCHECKED,
      path: [""],
      kind: "folder",
      children: [],
      parentPath: [],
    };

    // Initialize empty nodes map.
    const nodes: { [key: string]: FileTreeNode } = {};
    nodes[""] = root;

    for (const file of this._availableFiles) {
      const path = file.path;
      const parentPath = path.slice(0, -1).join("/");

      const node: FileTreeNode = {
        checked: CheckboxState.UNCHECKED,
        path: path,
        kind: file.kind,
        children: [],
        parentPath: path.slice(0, -1),
      };

      makeObservable(node, {
        checked: observable,
      });

      nodes[path.join("/")] = node;
      nodes[parentPath].children.push(node);
    }

    this._nodes = nodes;
    this._root = root;
    return root;
  }

  get fileTreeRoot() {
    if (!this._root) this._root = this.constructTree();
    return this._root;
  }

  @action
  checkNode(item: FileTreeNode) {
    item.checked = match(item.checked)
      .with(CheckboxState.CHECKED, () => CheckboxState.UNCHECKED)
      .with(CheckboxState.INDETERMINATE, () => CheckboxState.UNCHECKED)
      .with(CheckboxState.UNCHECKED, () => CheckboxState.CHECKED)
      .exhaustive();

    this.propagateSelectionStateDown(item);
    this.propagateSelectionStateUp(item);
  }

  @action
  propagateSelectionStateDown(node: FileTreeNode) {
    if (node.children.length === 0) return node.checked;
    if (node.checked === CheckboxState.INDETERMINATE)
      throw new Error("Tried to propagate down from indeterminate node");

    const newChildState = node.checked;
    for (const child of node.children) {
      child.checked = newChildState;
      this.propagateSelectionStateDown(child);
    }
  }

  @action
  propagateSelectionStateUp(node: FileTreeNode) {
    if (node.parentPath.length === 0) return;
    const parent = this._nodes[node.parentPath.join("/")];

    // Manually append the node state so we don't run into sync issues with separate transactions.
    const childrenStates = parent.children
      .filter((c) => c.path !== node.path)
      .map((c) => c.checked);

    childrenStates.push(node.checked);

    const allChecked = childrenStates.every((c) => c === CheckboxState.CHECKED);
    const allUnchecked = childrenStates.every((c) => c === CheckboxState.UNCHECKED);
    const someChecked = !allChecked && !allUnchecked;

    if (allChecked) parent.checked = CheckboxState.CHECKED;
    else if (allUnchecked) parent.checked = CheckboxState.UNCHECKED;
    else if (someChecked) parent.checked = CheckboxState.INDETERMINATE;

    this.propagateSelectionStateUp(parent);
  }
}

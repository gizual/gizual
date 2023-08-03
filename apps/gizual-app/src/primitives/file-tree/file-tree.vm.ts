import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";
import type { DataNode } from "antd/es/tree";
import { FileTree } from "@giz/explorer";
import React from "react";

export type FileTreeDataNode = DataNode & {
  children: FileTreeDataNode[];
  path: string;
};

export class FileTreeViewModel {
  _mainController: MainController;
  _expandedKeys: Set<React.Key> = new Set();

  constructor(mainController: MainController) {
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  toggleFile(name: string) {
    this._mainController.toggleFile(name);
  }

  get selectedFiles(): string[] {
    return this._mainController.selectedFiles;
  }

  toggleFavourite(name: string) {
    this._mainController.toggleFavourite(name);
  }

  get favouriteFiles(): string[] {
    return this._mainController.favouriteFiles;
  }

  get treeData(): FileTreeDataNode[] {
    const root = this._mainController.fileTreeRoot;
    if (!root) return [];

    const parseChildren = (el: FileTree, path: string, key: string): FileTreeDataNode[] => {
      if (!el.children) return [];

      const children: FileTreeDataNode[] = [];
      for (const [index, child] of el.children.entries()) {
        if (!child.name) continue;

        const childKey = key + "-" + index;
        const childPath = path ? path + "/" + child.name : child.name;
        children.push({
          key: childPath, //key + "-" + index,
          title: child.name ?? "---unknown",
          children: parseChildren(child, childPath, childKey),
          isLeaf: child.kind !== "folder",
          path: childPath,
        });
      }

      return children;
    };

    const children = parseChildren(root, "", "0");
    if (children.length > 0) return children;

    return [];
  }

  onFileTreeSelect(node: FileTreeDataNode) {
    if (node.isLeaf) {
      this.toggleFile(node.path);
      return;
    }

    const toggleChildren = (currentNode: FileTreeDataNode) => {
      if (!currentNode.children) return;

      for (const child of currentNode.children) {
        if (child.isLeaf) {
          this.toggleFile(child.path);
        } else {
          toggleChildren(child);
        }
      }

      this._expandedKeys.add(currentNode.key);
    };

    toggleChildren(node);
  }

  onFileTreeExpand(expandedKeys: React.Key[]) {
    this._expandedKeys = new Set(expandedKeys);
  }

  get expandedKeys(): React.Key[] {
    return [...this._expandedKeys];
  }
}

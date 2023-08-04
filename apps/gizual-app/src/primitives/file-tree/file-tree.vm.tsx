import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";
import type { DataNode } from "antd/es/tree";
import { FileIcon, FileTree, getFileIcon } from "@giz/explorer";
import React from "react";
import { isNumber } from "lodash";
import { FileNodeInfos } from "@app/types";

export type FileTreeDataNode = DataNode &
  FileNodeInfos & {
    children: FileTreeDataNode[];
  };

export class FileTreeViewModel {
  _mainController: MainController;
  _expandedKeys: Set<React.Key> = new Set();

  constructor(mainController: MainController) {
    this._mainController = mainController;
    this._mainController.vmController.setFileTreeViewModel(this);

    makeAutoObservable(this);
  }

  toggleFile(name: string, info: FileNodeInfos) {
    this._mainController.toggleFile(name, info);
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

        let fileIcon: FileIcon | undefined;
        if (isNumber(child.kind)) fileIcon = getFileIcon(child.kind);

        children.push({
          key: childPath, //key + "-" + index,
          title: child.name,
          children: parseChildren(child, childPath, childKey),
          isLeaf: child.kind !== "folder",
          fileIcon: fileIcon?.icon,
          fileIconColor: fileIcon?.color,
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
      this.toggleFile(node.path, node);
      return;
    }

    const toggleChildren = (currentNode: FileTreeDataNode) => {
      if (!currentNode.children) return;

      for (const child of currentNode.children) {
        if (child.isLeaf) {
          this.toggleFile(child.path, child);
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

import { FileNodeInfos } from "@app/types";
import type { DataNode } from "antd/es/tree";
import { isNumber } from "lodash";
import { makeAutoObservable } from "mobx";
import React from "react";

import { FileIcon, FileTree, getFileIcon } from "@giz/explorer";
import { MainController } from "../../controllers";

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

  get selectedFavouriteFiles(): string[] {
    const files: string[] = [];
    for (const file of this.selectedFiles) {
      if (this._mainController.favouriteFiles.has(file)) files.push(file);
    }
    return files;
  }

  toggleFavourite(name: string) {
    this._mainController.toggleFavourite(name);
  }

  get favouriteTreeData(): FileTreeDataNode[] {
    const tree: FileTreeDataNode[] = [];

    for (const [path, info] of this._mainController.favouriteFiles) {
      if (!info) continue;
      tree.push({
        key: path,
        children: [],
        path: path,
        title: path,
        fileIcon: info.fileIcon,
        fileIconColor: info.fileIconColor,
        isLeaf: true,
      });
    }

    return tree;
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

  onFileTreeSelect(node: FileTreeDataNode, check = false) {
    if (node.isLeaf) {
      this.toggleFile(node.path, node);
      return;
    }

    const toggleChildren = (currentNode: FileTreeDataNode) => {
      if (!currentNode.children) return;

      for (const child of currentNode.children) {
        if (check) {
          if (child.isLeaf) {
            this.toggleFile(child.path, child);
          } else {
            toggleChildren(child);
          }
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

  zoomToFile(path: string) {
    this._mainController.vmController?.canvasViewModel?.zoomToFile(path);
  }

  setFavourite(node: FileTreeDataNode) {
    this._mainController.toggleFavourite(node.path, node);
  }

  isFavourite(node: FileTreeDataNode) {
    return this._mainController.favouriteFiles.has(node.path);
  }

  isFileSelected(node: FileTreeDataNode) {
    return this._mainController.isFileSelected(node.path);
  }
}
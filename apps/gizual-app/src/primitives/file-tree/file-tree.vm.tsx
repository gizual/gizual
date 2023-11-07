import { MainController } from "@app/controllers";
import { FileNodeInfos } from "@app/types";
import type { DataNode } from "antd/es/tree";
import { isNumber } from "lodash";
import _ from "lodash";
import { makeAutoObservable, runInAction } from "mobx";
import React from "react";

import { FileIcon, FileTree, getFileIcon } from "@giz/explorer-web";

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
    this._mainController.repoController.toggleFile(name, info);
  }

  get selectedFiles(): string[] {
    return this._mainController.selectedFiles;
  }

  get selectedFavoriteFiles(): string[] {
    const files: string[] = [];
    for (const file of this.selectedFiles) {
      if (this._mainController.favoriteFiles.has(file)) files.push(file);
    }
    return files;
  }

  toggleFavorite(name: string) {
    this._mainController.toggleFavorite(name);
  }

  get favoriteTreeData(): FileTreeDataNode[] {
    const tree: FileTreeDataNode[] = [];

    for (const [path, info] of this._mainController.favoriteFiles) {
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

    let numFiles = 0;
    const parseChildren = (el: FileTree, path: string, key: string): FileTreeDataNode[] => {
      if (!el.children) return [];

      const children: FileTreeDataNode[] = [];
      for (const [index, child] of el.children.entries()) {
        if (!child.name) continue;

        const childKey = key + "-" + index;
        const childPath = path ? path + "/" + child.name : child.name;
        numFiles++;

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

      runInAction(() => {
        this._mainController.setNumFiles(numFiles);
      });
      return children;
    };

    const children = parseChildren(root, "", "0");
    if (children.length > 0) return children;

    return [];
  }

  onFileTreeSelect(node: FileTreeDataNode) {
    if (node.isLeaf) {
      this.toggleFile(node.path, node);
      this.zoomToFile(node.path);
      return;
    }

    const getChildrenFlat = (currentNode: FileTreeDataNode): FileTreeDataNode[] => {
      if (currentNode.isLeaf) return [currentNode];
      if (!currentNode.children) return [];

      // eslint-disable-next-line unicorn/prefer-array-flat
      return _.flatten(
        currentNode.children.map((element: FileTreeDataNode) => getChildrenFlat(element)),
      );
    };

    const children = getChildrenFlat(node);
    if (children?.every((c) => this.selectedFiles.includes(c.path))) {
      for (const child of children) {
        this._mainController.repoController.selectedFiles.delete(child.path);
      }
    } else {
      for (const child of children) {
        this._mainController.repoController.selectedFiles.set(child.path, child);
      }
      this._mainController.repoController.updateFileTag();
    }
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

  setFavorite(node: FileTreeDataNode) {
    this._mainController.toggleFavorite(node.path, node);
  }

  isFavorite(node: FileTreeDataNode) {
    return this._mainController.favoriteFiles.has(node.path);
  }

  isFileSelected(node: FileTreeDataNode) {
    return this._mainController.isFileSelected(node.path);
  }
}

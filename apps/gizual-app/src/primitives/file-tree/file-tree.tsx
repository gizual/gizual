import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import React from "react";

import { useMainController } from "../../controllers";

import styles from "./file-tree.module.scss";
import { FileTreeViewModel } from "./file-tree.vm";
import { FileTreeMock } from "./mock";

type FileTreeNode = {
  name: string;
  isDirectory: boolean;
  children: FileTreeNode[];
};

type FileTreeProps = {
  root?: FileTreeNode;
  mode?: "favourite" | "tree";
};

function FileTree({ root, mode = "full" }: FileTreeProps) {
  const mainController = useMainController();
  if (!root) root = FileTreeMock;

  const vm: FileTreeViewModel = React.useMemo(() => {
    return new FileTreeViewModel(root!, mainController);
  }, []);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set<string>());

  const handleNodeToggle = action((name: string, isDirectory: boolean) => {
    if (!isDirectory) {
      vm.toggleFile(name);
      return;
    }
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(name)) {
      newExpandedNodes.delete(name);
    } else {
      newExpandedNodes.add(name);
    }
    setExpandedNodes(newExpandedNodes);
  });

  const renderNode = (node: FileTreeNode, path: string) => {
    const fullPath = `${path}/${node.name}`;
    const isExpanded = expandedNodes.has(fullPath);
    return (
      <div key={fullPath}>
        <div className={styles.Node} onClick={() => handleNodeToggle(fullPath, node.isDirectory)}>
          <span>{node.name}</span>
          {node.isDirectory && <span>{isExpanded ? "-" : "+"}</span>}
        </div>
        {isExpanded && (
          <div className={styles.Children}>
            {node.children.map((child) => renderNode(child, fullPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {mode === "favourite" ? (
        <div className={styles.FileList}>
          <ul>
            {vm.favouriteFiles.map((file) => (
              <li key={file} onClick={() => handleNodeToggle(file, false)}>
                {file}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <div className={styles.FileList}>
            <ul>
              {vm.selectedFiles.map((file) => (
                <li key={file} onClick={() => handleNodeToggle(file, false)}>
                  {file}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.Tree}>{renderNode(root, "")}</div>
        </div>
      )}
    </div>
  );
}

export default observer(FileTree);

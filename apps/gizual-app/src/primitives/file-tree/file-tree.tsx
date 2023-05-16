import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import React from "react";

import { useMainController } from "../../controllers";

import styles from "./file-tree.module.scss";
import {FileTreeNode, FileTreeViewModel} from "./file-tree.vm";
import { FileTreeMock } from "./mock";

type FileTreeProps = {
  root?: FileTreeNode;
  mode?: "favourite" | "tree";
};

function FileTree({ root, mode = "tree" }: FileTreeProps) {
  const mainController = useMainController();
  root = mainController.fileTreeRoot ?? FileTreeMock;

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

  const renderNode = (node: FileTreeNode, path: string | undefined) => {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedNodes.has(fullPath);
    const isDirectory = node.children ? node.children.length > 0 : false;
    return (
      <div key={fullPath}>
        <div className={styles.Node} onClick={() => handleNodeToggle(fullPath, isDirectory)}>
          <span>{node.name}</span>
          {isDirectory && <span>{isExpanded ? "-" : "+"}</span>}
        </div>
        {isExpanded && (
          <div className={styles.Children}>
            {node.children?.map((child) => renderNode(child, fullPath))}
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
          {vm.selectedFiles.length > 0 && (
            <span className={styles.FileListHeader}>Selected Files:</span>
          )}
          <div className={styles.FileList}>
            <ul>
              {vm.selectedFiles.map((file) => (
                <li key={file} onClick={() => handleNodeToggle(file, false)}>
                  {file}
                </li>
              ))}
            </ul>
          </div>
          {vm.selectedFiles.length > 0 && <hr className={styles.hr} />}
          {root.children?.map((c) => (
            <div className={styles.Tree}>{renderNode(c)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default observer(FileTree);

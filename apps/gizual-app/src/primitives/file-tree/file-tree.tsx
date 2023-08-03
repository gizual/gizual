import { FileTreeNode } from "@app/types";
import { Skeleton, Tree } from "antd";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import { useMainController } from "../../controllers";

import styles from "./file-tree.module.scss";
import { FileTreeViewModel } from "./file-tree.vm";

type FileTreeProps = {
  root?: FileTreeNode;
  mode?: "favourite" | "tree";
};

function FileTree({ mode = "tree" }: FileTreeProps) {
  const mainController = useMainController();

  const vm: FileTreeViewModel = React.useMemo(() => {
    return new FileTreeViewModel(mainController);
  }, []);

  return (
    <>
      {mode === "favourite" ? (
        <div />
      ) : (
        <Tree
          checkable
          onCheck={(_, i) => vm.onFileTreeSelect(i.node)}
          checkedKeys={vm.selectedFiles}
          multiple
          defaultExpandAll
          showIcon
          showLine
          treeData={vm.treeData}
          className={styles.Tree}
          rootClassName={styles.Tree}
          onSelect={(_, i) => vm.onFileTreeSelect(i.node)}
          selectedKeys={vm.selectedFiles}
          onExpand={(k) => vm.onFileTreeExpand(k)}
          expandedKeys={vm.expandedKeys}
        />
      )}
    </>
  );
}

function FavouriteFileList({ root, mode = "tree" }: FileTreeProps) {
  const mainController = useMainController();
  root = mainController.fileTreeRoot;

  const vm: FileTreeViewModel = React.useMemo(() => {
    return new FileTreeViewModel(mainController);
  }, []);

  const handleNodeToggle = action((name: string, isDirectory: boolean) => {
    if (!isDirectory) {
      vm.toggleFile(name);
      return;
    }
  });

  if (!root) {
    return <Skeleton active />;
  }
  return (
    <div>
      <div className={styles.FileList}>
        <ul>
          {vm.favouriteFiles.map((file) => (
            <li key={file} onClick={() => handleNodeToggle(file, false)}>
              {file}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default observer(FileTree);

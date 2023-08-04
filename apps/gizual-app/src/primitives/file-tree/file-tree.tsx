import { FileTreeNode } from "@app/types";
import { Skeleton, Tree } from "antd";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { IconButton } from "../icon-button";

import { useMainController } from "../../controllers";
import { ReactComponent as Focus } from "../../assets/icons/focus.svg";

import styles from "./file-tree.module.scss";
import { FileTreeViewModel } from "./file-tree.vm";
import { FontIcon } from "../font-icon/font-icon";

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
          //onSelect={(_, i) => vm.onFileTreeSelect(i.node)}
          selectedKeys={vm.selectedFiles}
          onExpand={(k) => vm.onFileTreeExpand(k)}
          expandedKeys={vm.expandedKeys}
          style={{ overflow: "scroll" }}
          titleRender={(node) => {
            const isDirectory = node.isLeaf === false;
            const isSelected = vm.selectedFiles.includes(node.path);
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <FontIcon name={node.fileIcon} colors={node.fileIconColor} />
                <div onClick={() => vm.onFileTreeSelect(node)}>{node.title}</div>
                {isSelected && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      gap: "0.25rem",
                    }}
                  >
                    <IconButton
                      onClick={() =>
                        vm._mainController.vmController?.canvasViewModel?.zoomToFile(node.path)
                      }
                      style={{ width: "1.5rem" }}
                    >
                      <Focus />
                    </IconButton>
                  </div>
                )}
              </div>
            );
          }}
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

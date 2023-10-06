import { useMainController } from "@app/controllers";
import { Dropdown, MenuProps, Tree } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import { FontIcon } from "../font-icon/font-icon";

import style from "./file-tree.module.scss";
import { FileTreeDataNode, FileTreeViewModel } from "./file-tree.vm";

type FileTreeProps = {
  vm?: FileTreeViewModel;
  mode?: "favourite" | "tree";
};

/**
 * File Tree component, responsible for rendering the file tree and the favourite tree.
 */
export const FileTree = observer(({ mode = "tree", vm: externalVm }: FileTreeProps) => {
  const mainController = useMainController();
  const vm: FileTreeViewModel = React.useMemo(() => {
    return externalVm || new FileTreeViewModel(mainController);
  }, []);

  const treeData = mode === "favourite" ? vm.favouriteTreeData : vm.treeData;
  const selectedKeys = mode === "favourite" ? vm.selectedFavouriteFiles : vm.selectedFiles;
  if (vm.treeData.length < 0) return <></>;

  // We're deliberately only setting `currentNode` when a right-click on a tree element is detected.
  // This right-click then triggers a rerender of the components of the `Dropdown` element, based on the
  // selected node. Including the `Dropdown` element for each entry of the `Tree` introduces lots of
  // rendering overhead for no apparent benefit.
  const [currentNode, setCurrentNode] = React.useState<FileTreeDataNode | undefined>(
    vm.treeData[0],
  );

  const items: MenuProps["items"] = React.useMemo(
    () => [
      {
        key: "1",
        label: currentNode && vm.isFileSelected(currentNode) ? "Close" : "Open",
        onClick: () => currentNode && vm.onFileTreeSelect(currentNode),
      },
      {
        key: "2",
        label: "Focus",
        disabled: currentNode && !vm.selectedFiles.includes(currentNode?.path),

        onClick: () => currentNode && vm.zoomToFile(currentNode?.path),
      },
      {
        key: "3",
        label:
          currentNode && vm.isFavourite(currentNode)
            ? "Remove from favourites"
            : "Mark as favourite",
        onClick: () => currentNode && vm.setFavourite(currentNode),
      },
    ],
    [currentNode],
  );

  return (
    <Dropdown menu={{ items }} trigger={["contextMenu"]}>
      <Tree
        checkable
        onCheck={(_, i) => vm.onFileTreeSelect(i.node, true)}
        checkedKeys={selectedKeys}
        multiple
        defaultExpandAll
        showIcon
        treeData={treeData}
        className={style.Tree}
        rootClassName={style.Tree}
        selectedKeys={vm.selectedFiles}
        onExpand={(k) => vm.onFileTreeExpand(k)}
        expandedKeys={vm.expandedKeys}
        onRightClick={(i) => setCurrentNode(i.node)}
        titleRender={(node) => {
          const isDirectory = node.isLeaf === false;
          const isExpanded = vm.expandedKeys.includes(node.key);
          let icon = node.fileIcon;
          if (isDirectory && !isExpanded) {
            icon = "directory-closed-icon";
          }
          if (isDirectory && isExpanded) {
            icon = "directory-open-icon";
          }

          return (
            <div key={node.key} className={style.TreeEntry}>
              <FontIcon name={icon} colours={node.fileIconColor} />
              <div className={style.TreeNode} onClick={() => vm.onFileTreeSelect(node)}>
                {node.title}
              </div>
            </div>
          );
        }}
      />
    </Dropdown>
  );
});

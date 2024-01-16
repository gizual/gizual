import { IconCollapse } from "@app/assets";
import { Checkbox } from "@mantine/core";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import React from "react";
import { match } from "ts-pattern";

import { FontIcon } from "../font-icon";

import style from "./file-tree.module.scss";
import {
  CheckboxState,
  FileTreeFlatItem,
  FileTreeMode,
  FileTreeNode,
  FileTreeViewModel,
} from "./file-tree.vm";

type FileTreeProps = {
  mode: FileTreeMode;
  files?: FileTreeFlatItem[];
  checked?: string[][];
};
const MAX_RENDER_DEPTH = 3;

export const FileTree = observer(({ files, checked }: FileTreeProps) => {
  const availableFiles = files; // useAvailableFiles();
  if (!availableFiles) return <>Empty set of files.</>;

  const vm = React.useMemo(() => {
    return new FileTreeViewModel(availableFiles, checked);
  }, [availableFiles]);

  return (
    <div className={style.FileTree__Root}>
      <div className={style.FileTree}>
        {vm.fileTreeRoot.children.map((i) => (
          <React.Fragment key={i.path.join("/")}>
            <FileTreeItem item={i} vm={vm} renderDepth={MAX_RENDER_DEPTH} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

const FileTreeItem = observer(
  ({
    item,
    vm,
    renderDepth = 1,
  }: {
    item: FileTreeNode;
    vm: FileTreeViewModel;
    renderDepth: number;
  }) => {
    const [isExpanded, setExpanded] = React.useState(false);
    const variants = {
      expanded: { opacity: 1, height: "auto" },
      hidden: { opacity: 0, height: 0 },
      exit: { opacity: 0, height: 0, display: "none" },
    };
    if (renderDepth <= 0) return <></>;

    const onClickItem = () => {
      if (item.kind === "file") vm.checkNode(item);
      else setExpanded(!isExpanded);
    };

    const checked = item.checked;
    const icon = match(item.kind)
      .with("file", () => "test-generic-icon")
      .with("folder", () => (isExpanded ? "directory-open-icon" : "directory-closed-icon"))
      .otherwise(() => "file-icon");

    return (
      <React.Fragment>
        <div className={style.FileTreeItem}>
          <IconCollapse
            className={style.FileTreeItem__Chevron}
            style={{
              transform: `rotate(${isExpanded ? "180deg" : "90deg"})`,
              visibility: item.kind === "file" ? "hidden" : "visible",
            }}
            onClick={onClickItem}
          />
          <Checkbox
            indeterminate={checked === CheckboxState.INDETERMINATE}
            checked={checked === CheckboxState.CHECKED}
            value={item.path.join("/")}
            onChange={() => {
              vm.checkNode(item);
            }}
          />
          <FontIcon name={icon} onClick={onClickItem} />
          <p className={style.FileTreeItem__Name} onClick={onClickItem} title={item.path.join("/")}>
            {item.path.slice(-1, undefined)}
          </p>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial="hidden"
              exit="exit"
              animate="expanded"
              variants={variants}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {item.children.map((c) => {
                return (
                  <div key={c.path.join("/")} className={clsx(style.Nested, style.FileTree)}>
                    <FileTreeItem
                      item={c}
                      vm={vm}
                      renderDepth={isExpanded ? MAX_RENDER_DEPTH : renderDepth - 1}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </React.Fragment>
    );
  },
);

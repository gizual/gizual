/* eslint-disable unicorn/no-null */
import { IconCollapse } from "@app/assets";
import { Checkbox } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useContextMenu } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React from "react";
import { match, Pattern } from "ts-pattern";

import { FileIcon, getFileIcon } from "@giz/explorer-web";
import { useAvailableFiles } from "@giz/maestro/react";
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
  checked?: string[];
  onChange?: (checked: string[]) => void;
};
const MAX_RENDER_DEPTH = 3;

export const FileTree = observer(({ files, checked, onChange }: FileTreeProps) => {
  const availableFiles = files ?? useAvailableFiles();
  if (!availableFiles) return <>Empty set of files.</>;

  const vm = React.useMemo(() => {
    return new FileTreeViewModel(availableFiles, checked);
  }, [availableFiles]);

  React.useEffect(() => {
    vm.assignCheckedState(checked);
  }, [checked]);

  const onChangeCb = () => {
    if (onChange) onChange(vm.checkedFiles);
  };

  return (
    <div className={style.FileTree__Root}>
      <div className={style.FileTree}>
        <FileTreeItem
          item={vm.fileTreeRoot}
          vm={vm}
          renderDepth={MAX_RENDER_DEPTH}
          onChange={onChangeCb}
          expanded={true}
          customDisplayName="/"
        />
      </div>
    </div>
  );
});

const FileTreeItem = observer(
  ({
    item,
    vm,
    renderDepth = 1,
    onChange,
    expanded = false,
    customDisplayName,
  }: {
    item: FileTreeNode;
    vm: FileTreeViewModel;
    renderDepth: number;
    onChange?: () => void;
    expanded?: boolean;
    customDisplayName?: string;
  }) => {
    const [isExpanded, setExpanded] = React.useState(expanded);
    const { showContextMenu } = useContextMenu();

    const variants = {
      expanded: { opacity: 1, height: "auto" },
      hidden: { opacity: 0, height: 0 },
      exit: { opacity: 0, height: 0, display: "none" },
    };
    if (renderDepth <= 0) return <></>;

    const onClickItem = () => {
      if (item.kind === "folder") {
        setExpanded(!isExpanded);
      } else {
        vm.checkNode(item);
      }
    };

    const checked = item.checked;
    let icon = match(item.kind)
      .with("folder", () =>
        isExpanded
          ? { icon: "directory-open-icon", color: ["dark-blue", null] }
          : { icon: "directory-closed-icon", color: ["dark-blue", null] },
      )
      .with(Pattern.number, (n) => getFileIcon(n))
      .otherwise(() => undefined) as FileIcon | undefined;

    if (!icon) {
      icon = { icon: "file-icon", color: ["dark-blue", null] };
    }

    return (
      <React.Fragment>
        <div className={style.FileTreeItem}>
          <IconCollapse
            className={style.FileTreeItem__Chevron}
            style={{
              transform: `rotate(${isExpanded ? "180deg" : "90deg"})`,
              visibility: item.kind === "folder" ? "visible" : "hidden",
            }}
            onClick={onClickItem}
          />
          <Checkbox
            indeterminate={checked === CheckboxState.INDETERMINATE}
            checked={checked === CheckboxState.CHECKED}
            value={item.path.join("/")}
            onChange={() => {
              vm.checkNode(item);
              onChange?.();
            }}
          />
          <FontIcon name={icon.icon} onClick={onClickItem} colors={icon.color} />
          <p
            className={style.FileTreeItem__Name}
            onClick={onClickItem}
            title={item.path.join("/")}
            onContextMenu={showContextMenu([
              {
                key: "copyPath",
                title: "Copy file path to clipboard",
                onClick: () => {
                  navigator.clipboard.writeText(item.path.join("/"));
                  notifications.show({
                    title: "Copied to clipboard",
                    message: "'" + item.path.join("/") + "'",
                  });
                },
              },
            ])}
          >
            {customDisplayName ?? item.path.slice(-1, undefined)}
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
                      onChange={onChange}
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

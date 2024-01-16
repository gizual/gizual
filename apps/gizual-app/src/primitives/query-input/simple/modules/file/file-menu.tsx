import { Menu } from "@mantine/core";
import React from "react";

import { UseQueryResult } from "@giz/maestro/react";

export type FileMenuItemsProps = {
  query: UseQueryResult;
  hideItems?: string[];
  disableItems?: string[];
  highlightItems?: string[];
};

export type ItemType = {
  key: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  highlighted?: boolean;
};

export const FileMenuItems = React.memo(
  ({ hideItems, disableItems, query, highlightItems }: FileMenuItemsProps) => {
    const items: ItemType[] = [
      {
        key: "pattern",
        title: "Pattern",
        onClick: () => {
          query.updateQuery({ files: { path: "" } });
        },
      },
      {
        key: "filePicker",
        title: "Pick files",
        onClick: () => {
          query.updateQuery({ files: { path: [] } });
        },
      },
      {
        key: "lastEditedBy",
        title: "Last edited by",
        onClick: () => {
          query.updateQuery({ files: { lastEditedBy: "" } });
        },
      },
      {
        key: "createdBy",
        title: "Created by",
        onClick: () => {
          query.updateQuery({ files: { createdBy: "" } });
        },
      },
      {
        key: "changedInRef",
        title: "Changed in ref",
        onClick: () => {
          query.updateQuery({ files: { changedInRef: "" } });
        },
      },
      {
        key: "contains",
        title: "Contains",
        onClick: () => {
          query.updateQuery({ files: { contains: "" } });
        },
      },
    ]
      .filter((item) => !hideItems?.includes(item.key))
      .map((item) => (disableItems?.includes(item.key) ? { ...item, disabled: true } : item))
      .map((item) => (highlightItems?.includes(item.key) ? { ...item, highlighted: true } : item));

    return (
      <Menu.Dropdown>
        {items.map((item) => (
          <Menu.Item
            key={item.key}
            onClick={() => item.onClick()}
            disabled={item.disabled ?? false}
            style={{ fontWeight: item.highlighted ? "bold" : "normal" }}
          >
            {item.title}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    );
  },
);

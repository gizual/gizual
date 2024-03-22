import { Menu } from "@mantine/core";
import { observer } from "mobx-react-lite";

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

function getFileMenuItems({ query, disableItems, hideItems, highlightItems }: FileMenuItemsProps) {
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
      disabled: true,
    },
    {
      key: "editedBy",
      title: "Edited by",
      onClick: () => {
        query.updateQuery({ files: { editedBy: "" } });
      },
      disabled: true,
    },
    {
      key: "createdBy",
      title: "Created by",
      onClick: () => {
        query.updateQuery({ files: { createdBy: "" } });
      },
      disabled: true,
    },
    {
      key: "changedInRef",
      title: "Changed in revision",
      onClick: () => {
        query.updateQuery({ files: { changedInRef: "" } });
      },
      //disabled: true,
    },
    {
      key: "contains",
      title: "Contains",
      onClick: () => {
        query.updateQuery({ files: { contains: "" } });
      },
      disabled: true,
    },
  ]
    .filter((item) => !hideItems?.includes(item.key))
    .map((item) => (disableItems?.includes(item.key) ? { ...item, disabled: true } : item))
    .map((item) => (highlightItems?.includes(item.key) ? { ...item, highlighted: true } : item));

  return items;
}

const FileMenuItems = observer(
  ({ hideItems, disableItems, query, highlightItems }: FileMenuItemsProps) => {
    const items = getFileMenuItems({ hideItems, disableItems, highlightItems, query });
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

export { FileMenuItems, getFileMenuItems };

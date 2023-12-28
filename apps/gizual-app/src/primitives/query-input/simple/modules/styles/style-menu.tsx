import { Menu } from "@mantine/core";
import React from "react";

import { UseQueryResult } from "@giz/maestro/react";

export type StyleMenuItemsProps = {
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

export const StyleMenuItems = React.memo(
  ({ hideItems, disableItems, query, highlightItems }: StyleMenuItemsProps) => {
    const items: ItemType[] = [
      {
        key: "fillAuthor",
        title: "Fill specific author",
        onClick: () => {
          query.updateQuery({ styles: undefined });
        },
      },
      {
        key: "fillCommit",
        title: "Fill specific commit",
        onClick: () => {
          query.updateQuery({ styles: undefined });
        },
      },
      {
        key: "fillTime",
        title: "Fill specific date/time",
        onClick: () => {
          query.updateQuery({ styles: undefined });
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

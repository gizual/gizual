import { Menu } from "@mantine/core";
import React from "react";

import { UseQueryResult } from "@giz/maestro/react";

export type TimeMenuItemsProps = {
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

export const TimeMenuItems = React.memo(
  ({ hideItems, disableItems, query, highlightItems }: TimeMenuItemsProps) => {
    const items: ItemType[] = [
      {
        key: "sinceFirstCommitBy",
        title: "Since first commit by",
        onClick: () => {
          query.updateQuery({ time: { sinceFirstCommitBy: "" } });
        },
      },
      {
        key: "rangeByDate",
        title: "Range by date",
        onClick: () => {
          query.updateQuery({ time: { rangeByDate: "" } });
        },
      },
      {
        key: "rangeByRef",
        title: "Range by revision",
        onClick: () => {
          query.updateQuery({ time: { rangeByRef: "" } });
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

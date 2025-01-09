import { Menu } from "@mantine/core";
import { observer } from "mobx-react-lite";

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

function getTimeMenuItems({ query, disableItems, hideItems, highlightItems }: TimeMenuItemsProps) {
  const items: ItemType[] = [
    {
      key: "sinceFirstCommitBy",
      title: "Since First Commit by",
      onClick: () => {
        query.setTimeMode("sinceFirstCommitBy");
      },
      //disabled: true,
    },
    {
      key: "rangeByDate",
      title: "Range by Date",
      onClick: () => {
        query.setTimeMode("rangeByDate");
      },
    },
    {
      key: "rangeByRef",
      title: "Range by Revision",
      onClick: () => {
        query.setTimeMode("rangeByRef");
      },
      //disabled: true,
    },
  ]
    .filter((item) => !hideItems?.includes(item.key))
    .map((item) => (disableItems?.includes(item.key) ? { ...item, disabled: true } : item))
    .map((item) => (highlightItems?.includes(item.key) ? { ...item, highlighted: true } : item));

  return items;
}

const TimeMenuItems = observer(
  ({ hideItems, disableItems, query, highlightItems }: TimeMenuItemsProps) => {
    const items = getTimeMenuItems({ hideItems, disableItems, highlightItems, query });
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

export { getTimeMenuItems, TimeMenuItems };

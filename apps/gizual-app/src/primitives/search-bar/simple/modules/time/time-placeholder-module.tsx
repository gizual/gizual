import { IconClock } from "@app/assets";
import { Dropdown, MenuProps } from "antd";

import { useQuery } from "@giz/maestro/react";
import { PlaceHolderModule } from "../base-module";

export function TimePlaceholderModule() {
  const query = useQuery();

  const items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Time-based filters",
      children: [
        {
          key: "sinceFirstCommitBy",
          label: "Since first commit by",
          onClick: () => {
            query.updateQuery({ time: { sinceFirstCommitBy: "" } });
          },
        },
        {
          key: "rangeByDate",
          label: "Range by date",
          onClick: () => {
            query.updateQuery({ time: { rangeByDate: "" } });
          },
        },
        {
          key: "rangeByRef",
          label: "Range by ref",
          onClick: () => {
            query.updateQuery({ time: { rangeByRef: "" } });
          },
        },
      ],
    },
  ];

  return (
    <Dropdown menu={{ items }} arrow>
      <PlaceHolderModule
        icon={<IconClock />}
        title={"Add time-based filter"}
        accentColor="#006aa3"
        onClick={(e) => {
          e.preventDefault();
        }}
      />
    </Dropdown>
  );
}

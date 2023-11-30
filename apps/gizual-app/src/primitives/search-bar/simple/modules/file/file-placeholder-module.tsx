import { IconFile } from "@app/assets";
import { Dropdown, MenuProps } from "antd";

import { useQuery } from "@giz/maestro/react";
import { PlaceHolderModule } from "../base-module";

export function FilePlaceholderModule() {
  const query = useQuery();

  const items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "File-based filters",
      children: [
        {
          key: "pattern",
          label: "Pattern",
          onClick: () => {
            query.updateQuery({ files: { path: "" } });
          },
        },
        {
          key: "filePicker",
          label: "Pick files",
        },
        {
          key: "lastEditedBy",
          label: "Last edited by",
          onClick: () => {
            query.updateQuery({ files: { lastEditedBy: "" } });
          },
        },
        {
          key: "createdBy",
          label: "Created by",
          onClick: () => {
            query.updateQuery({ files: { createdBy: "" } });
          },
        },
        {
          key: "changedInRef",
          label: "Changed in ref",
          onClick: () => {
            query.updateQuery({ files: { changedInRef: "" } });
          },
        },
        {
          key: "contains",
          label: "Contains",
          onClick: () => {
            query.updateQuery({ files: { contains: "" } });
          },
        },
      ],
    },
  ];

  return (
    <Dropdown menu={{ items }} arrow>
      <PlaceHolderModule
        icon={<IconFile />}
        title={"Add file-based filter"}
        accentColor="#a3007b"
        onClick={(e) => {
          e.preventDefault();
        }}
      />
    </Dropdown>
  );
}

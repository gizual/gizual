import { useMainController } from "@app/controllers";
import { LinearProgress } from "@app/primitives/linear-progress";
import { useWindowSize } from "@app/utils";
import { Avatar, Skeleton, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import React from "react";

import { useAuthorList } from "@giz/maestro/react";
import sharedStyle from "../css/shared-styles.module.scss";

import style from "./author-panel.module.scss";
import { AuthorPanelViewModel } from "./author-panel.vm";

export type AuthorPanelProps = {
  vm?: AuthorPanelViewModel;
};

interface AuthorType {
  key: React.Key;
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export function AuthorPanel() {
  return (
    <div className={style.SettingsPanel}>
      <div className={sharedStyle.Section}>
        <div className={sharedStyle.SectionHead}>
          <h1>Authors</h1>
        </div>
        <AuthorTable />
      </div>
    </div>
  );
}

export function AuthorTable() {
  const columns = getAuthorColumns();
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isPlaceholderData } = useAuthorList(10, (page - 1) * 10);
  const [_, height] = useWindowSize();

  const authors = data?.authors.map((author) => {
    return {
      key: author.id,
      id: author.id,
      name: author.name,
      email: author.email,
      avatar: author.gravatarHash,
    };
  });

  if (!isLoading && data === undefined) {
    return <div>An unknown error occurred.</div>;
  }

  if (isLoading && data === undefined) {
    return (
      <div className={style.PaddedPlaceholder}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className={style.Table}>
      <Table
        size={"small"}
        dataSource={authors}
        columns={columns}
        pagination={{
          pageSizeOptions: [5, 10, 15],
          current: page,
          total: data!.total,
          pageSize: height < 850 ? 5 : 10,
          onChange(page, _pageSize) {
            setPage(page);
          },
        }}
        showHeader={false}
      />
      {isPlaceholderData && <LinearProgress className={style.Progress} />}
    </div>
  );
}

function getAuthorColumns(): ColumnsType<AuthorType> {
  const mainController = useMainController();

  return [
    {
      title: "",
      dataIndex: "gutter",
      render: (_, record) => (
        <div
          style={{
            width: 5,
            height: 25,
            display: "block",
            borderRadius: 5,
            backgroundColor:
              mainController.coloringMode === "author"
                ? mainController.authorColorScale(record.id ?? "")
                : "transparent",
          }}
        />
      ),
    },
    {
      title: "",
      dataIndex: "avatar",
      render: (_, record) => {
        return (
          <Avatar
            crossOrigin="anonymous"
            src={`https://www.gravatar.com/avatar/${record.avatar}?d=retro`}
            style={{ border: "1px solid var(--border-primary)", width: 28, height: 28 }}
          />
        );
      },
    },
    {
      title: "Author",
      dataIndex: "email",
      render: (_, record) => (
        <>
          <p
            style={{
              whiteSpace: "break-spaces",
              textAlign: "left",
              overflowWrap: "anywhere",
              fontSize: "1em",
              lineHeight: "1em",
            }}
          >
            {record.name}
          </p>
          <p
            style={{
              whiteSpace: "break-spaces",
              textAlign: "left",
              overflowWrap: "anywhere",
              fontSize: "0.875em",
              lineHeight: "0.875em",
              paddingTop: "0.25rem",
            }}
          >
            {record.email}
          </p>
        </>
      ),
    },
  ];
}

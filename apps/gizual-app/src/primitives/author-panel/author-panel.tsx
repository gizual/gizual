import { MainController, useMainController } from "@app/controllers";
import { Avatar, Skeleton } from "@mantine/core";
import type { DataTableColumn } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import React from "react";

import { useAuthorList } from "@giz/maestro/react";
import sharedStyle from "../css/shared-styles.module.scss";
import { LinearProgress } from "../linear-progress";

import style from "./author-panel.module.scss";

export type AuthorPanelProps = {};

interface AuthorType {
  key: React.Key;
  id: string;
  name: string;
  email: string;
  avatar: string;
}

const PAGE_SIZE = 10;

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
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isPlaceholderData } = useAuthorList(10, (page - 1) * 10);
  const mainController = useMainController();

  const authors = React.useMemo(
    () =>
      data?.authors.map((author) => {
        return {
          key: author.id,
          id: author.id,
          name: author.name,
          email: author.email,
          avatar: author.gravatarHash,
        };
      }),
    [data?.authors],
  );

  const columns = React.useMemo(() => getAuthorColumns(mainController), []);

  if (!isLoading && data === undefined) {
    return <div>An unknown error occurred.</div>;
  }

  if (isLoading && data === undefined) {
    return (
      <div className={style.PaddedPlaceholder}>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className={style.Table}>
      <DataTable
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={authors}
        columns={columns}
        recordsPerPage={PAGE_SIZE}
        onPageChange={(p) => {
          setPage(p);
        }}
        totalRecords={data?.total}
        page={page}
        backgroundColor={"var(--background-primary)"}
        stripedColor={"var(--background-secondary)"}
        highlightOnHoverColor={"var(--background-tertiary)"}
        borderColor={"var(--border-primary)"}
      />
      {isPlaceholderData && <LinearProgress className={style.Progress} />}
    </div>
  );
}

function getAuthorColumns(mainController: MainController): DataTableColumn<AuthorType>[] {
  return [
    {
      title: "",
      accessor: "gutter",
      render: ({ id }: AuthorType) => (
        <div
          style={{
            width: 5,
            height: 25,
            display: "block",
            borderRadius: 5,
            backgroundColor:
              mainController.coloringMode === "author"
                ? mainController.authorColorScale(id ?? "")
                : "transparent",
          }}
        />
      ),
    },
    {
      title: "",
      accessor: "avatar",
      render: ({ avatar }: AuthorType) => {
        return (
          <Avatar
            imageProps={{ crossOrigin: "anonymous" }}
            src={`https://www.gravatar.com/avatar/${avatar}?d=retro`}
            style={{ border: "1px solid var(--border-primary)", minWidth: 28, minHeight: 28 }}
          />
        );
      },
    },
    {
      title: "Author",
      accessor: "email",
      render: ({ name, email }: AuthorType) => (
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
            {name}
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
            {email}
          </p>
        </>
      ),
    },
  ];
}

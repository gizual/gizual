import { useLocalQueryCtx } from "@app/utils";
import { Avatar, Skeleton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import clsx from "clsx";
import { ShowContextMenuFunction, useContextMenu } from "mantine-contextmenu";
import type { DataTableColumn } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import React from "react";

import { useAuthorList } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import { ColorPicker } from "../color-picker";
import sharedStyle from "../css/shared-styles.module.scss";
import { LinearProgress } from "../linear-progress";

import style from "./author-panel.module.scss";

export type AuthorPanelProps = {};

interface AuthorType {
  id: string;
  name: string;
  email: string;
  gravatarHash: string;
  color: string;
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

function getAuthorColors(query: SearchQueryType) {
  if (query.preset && "paletteByAuthor" in query.preset) {
    return query.preset.paletteByAuthor;
  }
  return [];
}

type AuthorTableProps = {
  className?: string;
  style?: React.CSSProperties;
  id?: string;

  dataTableProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
};

export function AuthorTable({ id, className, style: cssStyle, dataTableProps }: AuthorTableProps) {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isPlaceholderData } = useAuthorList(10, (page - 1) * 10);
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
  const authorColors = getAuthorColors(localQuery);
  const { showContextMenu } = useContextMenu();

  const columns = getAuthorColumns(
    authorColors,
    updateLocalQuery,
    publishLocalQuery,
    showContextMenu,
  );

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
    <div className={clsx(style.Table, className)} style={cssStyle} id={id}>
      <DataTable
        className={clsx(style.DataTable, dataTableProps?.className)}
        style={dataTableProps?.style}
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={data?.authors}
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
        paginationSize="xs"
      />
      {isPlaceholderData && <LinearProgress className={style.Progress} />}
    </div>
  );
}

function insertAuthorColor(authorColors: [string, string][], authorId: string, color: string) {
  const index = authorColors.findIndex((c) => c[0] === authorId);
  if (index === -1) {
    authorColors.push([authorId, color]);
  } else {
    authorColors[index][1] = color;
  }
}

function getAuthorColumns(
  authorColors: [string, string][],
  updateQuery: (q: Partial<SearchQueryType>) => void,
  publishLocalQuery: () => void,
  showContextMenu: ShowContextMenuFunction,
): DataTableColumn<AuthorType>[] {
  return [
    {
      title: "",
      accessor: "gutter",
      render: ({ id, color }: AuthorType) => {
        const authorColor = authorColors.find((c) => c[0] === id)?.[1] ?? color;
        return (
          <ColorPicker
            key={`${id}-${color}`}
            hexValue={authorColor}
            onAccept={(c) => {
              const colors = [...authorColors];
              insertAuthorColor(colors, id, c);
              updateQuery({ preset: { paletteByAuthor: colors } });
            }}
          />
        );
      },
      cellsStyle: () => {
        return {
          width: 40,
        };
      },
    },
    {
      title: "",
      accessor: "avatar",
      render: ({ gravatarHash }: AuthorType) => {
        return (
          <Avatar
            imageProps={{ crossOrigin: "anonymous" }}
            src={`https://www.gravatar.com/avatar/${gravatarHash}?d=retro`}
            style={{ border: "1px solid var(--border-primary)", minWidth: 28, minHeight: 28 }}
          />
        );
      },
      cellsStyle: () => {
        return {
          width: 60,
        };
      },
    },
    {
      title: "Author",
      accessor: "email",
      render: ({ id, name, email }: AuthorType) => (
        <div
          onContextMenu={showContextMenu([
            {
              key: "copyId",
              title: "Copy author ID to clipboard",
              onClick: () => {
                navigator.clipboard.writeText(id);
                notifications.show({
                  title: "ID copied to clipboard",
                  message: id,
                });
              },
            },
            {
              key: "copyName",
              title: "Copy name to clipboard",
              onClick: () => {
                navigator.clipboard.writeText(name);
                notifications.show({
                  title: "Name copied to clipboard",
                  message: name,
                });
              },
            },
            {
              key: "copyEmail",
              title: "Copy email to clipboard",
              onClick: () => {
                navigator.clipboard.writeText(email);
                notifications.show({
                  title: "E-Mail copied to clipboard",
                  message: email,
                });
              },
            },
          ])}
        >
          <p
            style={{
              whiteSpace: "break-spaces",
              textAlign: "left",
              overflowWrap: "anywhere",
              fontSize: "0.875em",
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
              fontSize: "0.75em",
              lineHeight: "0.75em",
              paddingTop: "0.25rem",
            }}
          >
            {email}
          </p>
        </div>
      ),
    },
  ];
}

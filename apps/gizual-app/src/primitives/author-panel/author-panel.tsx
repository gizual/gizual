import { useLocalQuery } from "@app/services/local-query";
import { Avatar } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import clsx from "clsx";
import { ShowContextMenuFunction, useContextMenu } from "mantine-contextmenu";
import type { DataTableColumn } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import { observer } from "mobx-react-lite";
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
  numCommits: number;
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

  noPublish?: boolean;
};

type PaginationProps =
  | Pick<
      React.ComponentProps<typeof DataTable<AuthorType>>,
      "page" | "onPageChange" | "totalRecords" | "recordsPerPage"
    >
  | undefined;

const AuthorTable = observer(
  ({ id, className, style: cssStyle, dataTableProps, noPublish }: AuthorTableProps) => {
    const [page, setPage] = React.useState(1);
    const { data, isLoading, isPlaceholderData } = useAuthorList(PAGE_SIZE, (page - 1) * PAGE_SIZE);
    const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQuery();
    const authorColors = getAuthorColors(localQuery);
    const { showContextMenu } = useContextMenu();

    // We only want pagination if there are more than `PAGE_SIZE` entries.
    // The Mantine DataTable attaches the pagination component whenever the `paginationProps` are set.
    const hasPagination = (data?.total ?? 0) > PAGE_SIZE;

    /** Contains the required properties to enable pagination. Undefined when pagination is disabled. */
    let paginationProps: PaginationProps = undefined;

    if (hasPagination) {
      paginationProps = {
        page,
        onPageChange: (p) => {
          setPage(p);
        },
        totalRecords: data?.total,
        recordsPerPage: PAGE_SIZE,
      };
    }

    const columns = getAuthorColumns(
      authorColors,
      updateLocalQuery,
      noPublish ? () => {} : publishLocalQuery,
      showContextMenu,
    );

    if (!data && isLoading) {
      return <div>Waiting for data ... please wait.</div>;
    }

    return (
      <div className={clsx(style.Table, className)} style={cssStyle} id={id}>
        <DataTable<AuthorType>
          className={clsx(style.DataTable, dataTableProps?.className)}
          style={dataTableProps?.style}
          withTableBorder
          withColumnBorders
          striped
          highlightOnHover
          records={data?.authors}
          columns={columns}
          backgroundColor={"var(--background-primary)"}
          stripedColor={"var(--background-secondary)"}
          highlightOnHoverColor={"var(--background-tertiary)"}
          borderColor={"var(--border-primary)"}
          paginationSize="xs"
          {...(paginationProps as any)}
        />
        {isPlaceholderData && <LinearProgress className={style.Progress} />}
      </div>
    );
  },
);

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
              publishLocalQuery();
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
      render: ({ id, name, email, numCommits }: AuthorType) => (
        <div
          onContextMenu={showContextMenu(
            [
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
            ],
            { styles: { item: { backgroundColor: "var(--background-secondary)" } } },
          )}
        >
          <div className={style.CellContainer__Header}>
            <p className={style.CellContainer__Name}>{name}</p>
            <div>
              <p className={style.CellContainer__NumCommits}>
                {`${numCommits} ${numCommits > 1 ? "commits" : "commit"}`}
              </p>
            </div>
          </div>
          <p className={style.CellContainer__Email}>{email}</p>
        </div>
      ),
    },
  ];
}

export { AuthorTable };

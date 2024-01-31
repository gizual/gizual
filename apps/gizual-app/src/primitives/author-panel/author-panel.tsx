import { Avatar, Skeleton } from "@mantine/core";
import type { DataTableColumn } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import React from "react";

import { ColorManager } from "@giz/color-manager";
import { useAuthorList, useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import { ColorPicker } from "../color-picker";
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

function useColorManager() {
  const { data, isLoading } = useAuthorList(1000, 0);
  const [colorManager, _] = React.useState<ColorManager>(new ColorManager());
  React.useEffect(() => {
    if (!isLoading && data) {
      colorManager.init({ domain: data.authors.map((a) => a.id) });
      console.log("Color manager initialized");
    }
  }, [isLoading]);

  return colorManager;
}

function getPaletteColors(query: SearchQueryType) {
  if (query && query.preset && "paletteByAuthor" in query.preset)
    return query.preset.paletteByAuthor;
  return [];
}

export function AuthorTable() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isPlaceholderData } = useAuthorList(10, (page - 1) * 10);
  const { query, updateQuery } = useQuery();
  const colorManager = useColorManager();
  const paletteColors = React.useMemo(() => getPaletteColors(query), [query]);

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

  const columns = React.useMemo(() => {
    console.log("Recomputing authorColumns", colorManager, colorManager?.isInitialized);
    return getAuthorColumns(colorManager, paletteColors, updateQuery);
  }, [colorManager.isInitialized, paletteColors]);

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

function insertAuthorColor(authorColors: [string, string][], authorId: string, color: string) {
  const index = authorColors.findIndex((c) => c[0] === authorId);
  if (index === -1) {
    authorColors.push([authorId, color]);
  } else {
    authorColors[index][1] = color;
  }
}

function getAuthorColumns(
  colorManager: ColorManager | undefined,
  customizedColors: [string, string][],
  updateQuery: (q: Partial<SearchQueryType>) => void,
): DataTableColumn<AuthorType>[] {
  console.log("loading author columns");
  return [
    {
      title: "",
      accessor: "gutter",
      render: ({ id }: AuthorType) => (
        <ColorPicker
          hexValue={(() => {
            if (!colorManager?.isInitialized) return "transparent";
            const customizedColor = customizedColors?.find((c) => c[0] === id);
            if (customizedColor) return customizedColor[1];
            return ColorManager.stringToHex(colorManager.getBandColor(id));
          })()}
          onAccept={(c) => {
            if (!colorManager?.isInitialized) return;
            insertAuthorColor(customizedColors ?? [], id, c);
            updateQuery({ preset: { paletteByAuthor: customizedColors } });
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

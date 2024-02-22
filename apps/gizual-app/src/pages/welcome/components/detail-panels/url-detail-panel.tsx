import { IconCollapse } from "@app/assets";
import { Button } from "@app/primitives";
import shared from "@app/primitives/css/shared-styles.module.scss";
import { Input } from "@app/primitives/input";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { FileLoaderUrl } from "@giz/maestro/react";
import style from "../../welcome.module.scss";

import { DetailPanelProps } from "./detail-panel";

type UrlDetailPanel = {
  loader: FileLoaderUrl;
} & Omit<DetailPanelProps, "loader" | "vm">;

export const UrlDetailPanel = observer(({ backArrow, onBackArrow, loader }: UrlDetailPanel) => {
  const [url, setUrl] = React.useState("");
  return (
    <div className={clsx(style.DetailColumn, shared.FlexColumn, style.Grow)}>
      <div className={style.CollapsibleHeader}>
        {backArrow && <IconCollapse className={style.BackIcon} onClick={onBackArrow} />}
        <h1 className={clsx(style.DetailHeader, shared.Grow)}>Open remote repository (from URL)</h1>
      </div>

      <p className={style.DetailDescription}>Load a public repository from the given URL.</p>
      <p className={style.DetailDescription}>
        The URL must point to a valid repository on Github, Bitbucket or Gitlab. Only a limited
        amount of repositories can be cloned within a given time period. Due to this limitation,
        this operation might fail.
      </p>
      <Input placeholder="Repository URL" value={url} onChange={(e) => setUrl(e.target.value)} />

      <Button
        className={style.LoadButton}
        variant="filled"
        onClick={() => {
          loader.load(url);
        }}
      >
        {`Load from URL`}
      </Button>
    </div>
  );
});

import { IconCollapse } from "@app/assets";
import { Button } from "@app/primitives";
import shared from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { FileLoaderZipFile } from "@giz/maestro/react";
import style from "../../welcome.module.scss";
import { showFilePicker } from "../../welcome.vm";

import { DetailPanelProps } from "./detail-panel";

type ZipDetailPanel = {
  loader: FileLoaderZipFile;
} & Omit<DetailPanelProps, "loader" | "vm">;

export const ZipDetailPanel = observer(({ loader, backArrow, onBackArrow }: ZipDetailPanel) => {
  const onAction = () => {
    showFilePicker("zip").then((files) => {
      loader.load(files[0]);
    });
  };

  return (
    <div className={clsx(style.DetailColumn, shared.FlexColumn, style.Grow)}>
      <div className={style.CollapsibleHeader}>
        {backArrow && <IconCollapse className={style.BackIcon} onClick={onBackArrow} />}
        <h1 className={clsx(style.DetailHeader, shared.Grow)}>Open from .zip file</h1>
      </div>

      <p className={style.DetailDescription}>Open a repository from a .zip file.</p>
      <p className={style.DetailDescription}>
        Zip files below 50MB are loaded into memory, larger files are streamed from disk using OPFS.
      </p>

      <div className={style.GifPanel} />

      <Button className={style.LoadButton} variant="filled" onClick={onAction}>
        {`Load from .zip file`}
      </Button>
    </div>
  );
});

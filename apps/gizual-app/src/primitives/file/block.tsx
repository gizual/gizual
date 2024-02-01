import { IconSource } from "@app/assets";
import { useSettingsController } from "@app/controllers";
import { maxCharactersThatFitInWidth, truncateSmart } from "@app/utils";
import { Loader, Skeleton } from "@mantine/core";
import React from "react";

import { FileIcon } from "@giz/explorer-web";
import { useBlockImage, useFileContent } from "@giz/maestro/react";
import sharedStyle from "../css/shared-styles.module.scss";
import { DialogProvider } from "../dialog-provider";
import { Editor } from "../editor";
import { FontIcon } from "../font-icon";

import style from "./file.module.scss";

type FileBlockProps = {
  id: string;
  height: number;
  parentContainer: Element | null;
  filePath?: string;
  fileType?: FileIcon | undefined;
};

export const FileBlock = ({ id, height, parentContainer, filePath, fileType }: FileBlockProps) => {
  const block = useBlockImage(id);
  const { isPreview, url, setPriority } = block;
  const ref = React.useRef<HTMLImageElement>(null);
  const settingsController = useSettingsController();

  // Attach IntersectionObserver on load, detach on dispose.

  React.useEffect(() => {
    if (!ref || !ref.current) return;

    const ioOptions: IntersectionObserverInit = {
      root: parentContainer,
      rootMargin: `${settingsController.visualizationSettings.canvas.rootMargin.value}px`,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    };

    const ioCallback: IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => {
      if (entries.length <= 0) return;
      setPriority(entries[0].intersectionRatio * 100);
    };

    const ioObserver = new IntersectionObserver(ioCallback, ioOptions);
    ioObserver.observe(ref.current);
    return () => {
      ioObserver.disconnect();
    };
  }, []);

  return (
    <div className={style.File}>
      <BlockHeader
        isPreview={isPreview}
        path={filePath ?? id}
        icon={fileType?.icon}
        iconColor={fileType?.color}
      />
      <div className={style.FileBody} style={{ height: height }}>
        {!url && <Skeleton />}
        <img className={style.FileCanvas} alt={url ? id : ""} height={height} src={url} ref={ref} />
      </div>
    </div>
  );
};

type BlockHeaderProps = {
  isPreview: boolean;
  path: string;
  icon?: string;
  iconColor?: [string | null, string | null] | undefined;
};

function BlockHeader({ isPreview, path, icon, iconColor }: BlockHeaderProps) {
  return (
    <div className={style.FileHead}>
      <div className={style.FileHeadLeft}>
        {isPreview ? (
          <div className={style.LoadingContainer}>
            <Loader />
          </div>
        ) : (
          <FontIcon className={style.FontIcon} name={icon} colors={iconColor} />
        )}
        <p className={style.FileTitle} title={path}>
          {truncateSmart(path, maxCharactersThatFitInWidth(180, 10))}
        </p>
      </div>
      <div className={style.FileActions}>
        <DialogProvider
          trigger={
            <div className={sharedStyle.Pointer}>
              <IconSource className={style.FileIcon} />
            </div>
          }
          title={`${truncateSmart(path, 80)} (Read-Only)`}
          contentClassName={style.EditorDialog}
        >
          <BlockEditor path={path} />
        </DialogProvider>
      </div>
    </div>
  );
}

function BlockEditor({ path }: { path: string }) {
  const { data, isLoading } = useFileContent(path);

  return <Editor fileContent={data} isLoading={isLoading} />;
}

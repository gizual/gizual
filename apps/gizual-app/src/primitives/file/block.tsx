import { IconDownload, IconSource } from "@app/assets";
import { useMainController, useSettingsController, useViewModelController } from "@app/controllers";
import { useStyle } from "@app/hooks/use-style";
import { Menu } from "@mantine/core";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { FileIcon } from "@giz/explorer-web";
import { useBlockImage, useFileContent, useMaestro } from "@giz/maestro/react";
import { GizDate } from "@giz/utils/gizdate";
import sharedStyle from "../css/shared-styles.module.scss";
import { FontIcon } from "../font-icon";
import { IconButton } from "../icon-button";

import {
  BLOCK_WIDTH,
  BUTTON_GAP,
  BUTTON_SIZE,
  FOOTER_HEIGHT,
  FOOTER_TEXT_PADDING,
  generateBlockHeader,
  HEADER_HEIGHT,
  ICON_SIZE,
  PADDING_CONTAINER,
  TITLE_HEIGHT,
} from "./block-helpers";
import style from "./file.module.scss";

function useDeferredFileContent(filePath: string) {
  const [loadFileContent, setLoadFileContent] = React.useState(false);
  const { data } = useFileContent(loadFileContent ? filePath : "");

  const loadContent = () => {
    setLoadFileContent(true);
  };

  return { data, loadContent };
}

type FileBlockProps = {
  id: string;
  height: number;
  parentContainer?: Element | null;
  filePath?: string;
  fileType?: FileIcon | undefined;
  isLfs?: boolean;
};

const FileBlock = observer((props: FileBlockProps) => {
  const { id, height, parentContainer, filePath } = props;
  const maestro = useMaestro();
  const { renderBlockSvg } = maestro;

  const useStyleFn = useMainController().getStyle;
  const block = useBlockImage(id);
  const { isPreview, url, setPriority, isTruncated } = block;
  const ref = React.useRef<any>(null);
  const settingsController = useSettingsController();

  const { data, loadContent } = useDeferredFileContent(filePath ?? id);

  const fileNameWithExtension = filePath?.split("/").pop();

  // Attach IntersectionObserver on load, detach on dispose.

  React.useEffect(() => {
    if (!ref || !ref.current || parentContainer === undefined) return;

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

  /**
   * TODO: This function currently naively pipes the image into the SVG.
   * Ideally, we would want to render this blob with the SVG rendering backend.
   *
   * Maybe the Export SVG option should only be present on blobs that were rendered with that backend.
   */
  const onExportSvg = async () => {
    const styleTag = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink"`;
    const style = `style="font-family: Courier New;font-size: 0.5rem;"`;
    const blockHeader = generateBlockHeader({
      useStyleFn,
      path: filePath ?? id,
      maxTextWidth: 300,
      noForeignObjects: true,
    }).render();

    // Render the block with the SVG backend
    const image = await renderBlockSvg(id);
    const group = `<g x="0" y="0">${blockHeader}<g x="0" y="0" transform="translate(0,20)">${image?.result}</g></g>`;

    const svg = `<svg ${styleTag} ${style} viewBox="0 0 300 ${height}">${group}</svg>`;

    const svgBlob = new Blob([svg.toString()]);
    const element = document.createElement("a");
    const curDate = new GizDate().toFileString();
    element.download = `gizual-export_${curDate}_${fileNameWithExtension ?? id}.svg`;
    element.href = window.URL.createObjectURL(svgBlob);
    element.click();
    element.remove();
  };

  /**
   * Writes the file content of the block to a file.
   */
  const onExportRaw = async () => {
    loadContent();

    if (data) {
      const blob = new Blob([data ?? ""]);
      const element = document.createElement("a");
      element.download = `${id}.gizual.txt`;
      element.href = window.URL.createObjectURL(blob);
      element.click();
      element.remove();
    }
  };

  const headerWithContentHeight = height + HEADER_HEIGHT;
  const totalHeight = headerWithContentHeight + (isTruncated ? FOOTER_HEIGHT : 0);

  return (
    <svg
      className={style.File}
      viewBox={`0 0 300 ${totalHeight}`}
      style={{
        width: 300,
        height: totalHeight,
        boxSizing: "content-box",
        margin: 0,
      }}
    >
      <FileBlockSvg
        {...props}
        url={url ?? ""}
        blockRef={ref}
        isPreview={isPreview}
        onExportSvg={onExportSvg}
        onExportRaw={onExportRaw}
        interactive
      />

      {isTruncated && (
        <g>
          <rect
            x={0}
            y={headerWithContentHeight}
            width={300}
            height={FOOTER_HEIGHT}
            style={{ fill: useStyleFn("--background-secondary") }}
          />
          <text
            x={150}
            y={totalHeight - FOOTER_TEXT_PADDING}
            textAnchor="middle"
            style={{ fontSize: 12, lineHeight: 16, fill: useStyleFn("--foreground-primary") }}
          >
            ... content truncated
          </text>
        </g>
      )}
    </svg>
  );
});

type FileBlockSvgProps = FileBlockProps & {
  url: string;
  blockRef?: React.RefObject<any>;
  isPreview?: boolean;
  transform?: { x: number; y: number };
  interactive?: boolean;
  noForeignObjects?: boolean;
  onExportSvg?: () => void;
  onExportRaw?: () => void;
};

const FileBlockSvg = observer(
  ({
    id,
    height,
    url,
    blockRef,
    isPreview,
    filePath,
    fileType,
    transform,
    interactive,
    noForeignObjects,
    onExportSvg,
    onExportRaw,
    isLfs,
  }: FileBlockSvgProps) => {
    const useStyleFn = useMainController().getStyle;

    return (
      <g x={transform?.x} y={transform?.y}>
        <image
          className="svg-block-image"
          href={url}
          ref={blockRef}
          x={0}
          y={HEADER_HEIGHT}
          width={300}
          height={height}
        />
        <BlockHeaderSvg
          isPreview={isPreview}
          path={filePath ?? id}
          icon={fileType?.icon}
          iconColor={fileType?.color}
          interactive={interactive}
          noForeignObjects={noForeignObjects}
          onExportSvg={onExportSvg}
          onExportRaw={onExportRaw}
        />
        {isLfs && (
          <text
            x={6}
            y={height / 2 + HEADER_HEIGHT + 4}
            textAnchor="left"
            style={{
              fontSize: 12,
              lineHeight: 16,
              fill: useStyleFn("--foreground-primary"),
            }}
          >
            LFS (Large File Storage)
          </text>
        )}
      </g>
    );
  },
);

// ---------------------------------------------
// -------------- BLOCK HEADER -----------------
// ---------------------------------------------

type BlockHeaderProps = {
  isPreview?: boolean;
  path: string;
  icon?: string;
  iconColor?: [string | null, string | null] | undefined;
  interactive?: boolean;
  noForeignObjects?: boolean;
  onExportSvg?: () => void;
  onExportRaw?: () => void;
};

/**
 * Returns a set of SVG elements that represent the header of a block. These elements need to be wrapped in a <svg> tag.
 */
function BlockHeaderSvg({
  isPreview,
  path,
  icon,
  iconColor,
  interactive,
  noForeignObjects,
  onExportSvg,
  onExportRaw,
}: BlockHeaderProps) {
  const vmController = useViewModelController();
  const hasMenu = import.meta.env.DEV && interactive;
  return (
    <>
      <g
        className="svg-block-header-group"
        style={{ fontFamily: noForeignObjects ? "Courier New" : "Iosevka Extended" }}
      >
        <g
          dangerouslySetInnerHTML={{
            __html: generateBlockHeader({ useStyleFn: useStyle, noForeignObjects, path }).render(),
          }}
        />
        {!noForeignObjects && (
          <foreignObject
            x={0}
            y={0}
            width={ICON_SIZE}
            height={ICON_SIZE}
            style={{ margin: "auto" }}
          >
            {isPreview && interactive ? (
              <div className={style.LoadingContainer} />
            ) : (
              <FontIcon
                className={style.FontIcon}
                name={icon}
                colors={iconColor}
                style={{
                  margin: "0 0 0 0",
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  display: "inline-block",
                  fontSize: "12px",
                  lineHeight: "16px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              />
            )}
          </foreignObject>
        )}
        {interactive && !noForeignObjects && (
          <foreignObject
            x={BLOCK_WIDTH - BUTTON_SIZE * 2 - BUTTON_GAP - PADDING_CONTAINER}
            y={(TITLE_HEIGHT - BUTTON_SIZE) / 2}
            width={BUTTON_SIZE * 2 + BUTTON_GAP}
            height={BUTTON_SIZE}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: BUTTON_GAP,
                width: "100%",
                height: "100%",
              }}
            >
              {hasMenu && (
                <Menu
                  withArrow
                  position="bottom"
                  styles={{
                    dropdown: {
                      backgroundColor: "var(--background-secondary)",
                      borderColor: "var(--border-primary)",
                    },
                  }}
                >
                  <Menu.Target>
                    <IconButton style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, padding: 0 }}>
                      <IconDownload className={clsx(sharedStyle.Pointer, style.FileIcon)} />
                    </IconButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={onExportRaw}>Download raw file content</Menu.Item>

                    <Menu.Item onClick={onExportSvg}>Export visualization as SVG</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
              <IconButton
                style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, padding: 0 }}
                onClick={() => vmController.editorViewModel.loadFileContent(path)}
              >
                <IconSource className={style.FileIcon} />
              </IconButton>
            </div>
          </foreignObject>
        )}
      </g>
    </>
  );
}

export { FileBlock, FileBlockSvg };

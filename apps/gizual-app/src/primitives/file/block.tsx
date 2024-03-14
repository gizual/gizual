import { IconDownload, IconSource } from "@app/assets";
import { useMainController, useSettingsController } from "@app/controllers";
import { useStyle } from "@app/hooks/use-style";
import { maxCharactersThatFitInWidth, truncateSmart } from "@app/utils";
import { SvgGroupElement, SvgRectElement, SvgTextElement } from "@app/utils/svg";
import { Loader, Menu, Skeleton } from "@mantine/core";
import clsx from "clsx";
import React from "react";

import { FileIcon } from "@giz/explorer-web";
import { useBlockImage, useFileContent } from "@giz/maestro/react";
import sharedStyle from "../css/shared-styles.module.scss";
import { DialogProvider } from "../dialog-provider";
import { Editor } from "../editor";
import { FontIcon } from "../font-icon";
import { IconButton } from "../icon-button";

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
  htmlBase?: "div" | "svg";
};

const FileBlock = ({
  id,
  height,
  parentContainer,
  filePath,
  fileType,
  htmlBase: htmlBaseProp,
}: FileBlockProps) => {
  const useStyleFn = useMainController().getStyle;
  const block = useBlockImage(id);
  const { isPreview, url, setPriority, isTruncated } = block;
  const ref = React.useRef<any>(null);
  const settingsController = useSettingsController();

  const { data, loadContent } = useDeferredFileContent(filePath ?? id);

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

  const htmlBase = htmlBaseProp ?? settingsController.devSettings.blockHtmlBase.value;

  if (htmlBase === "div")
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
          <img
            className={style.FileCanvas}
            alt={url ? id : ""}
            height={height}
            src={url}
            ref={ref}
          />
        </div>
      </div>
    );

  /**
   * TODO: This function currently naively pipes the image into the SVG.
   * Ideally, we would want to render this blob with the SVG rendering backend.
   *
   * Maybe the Export SVG option should only be present on blobs that were rendered with that backend.
   */
  const onExportSvg = async () => {
    const styleTag = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink"`;
    const style = `style="font-family: Courier New;font-size: 0.5rem;"`;
    const blockHeader = generateBlockHeader({ useStyleFn, path: filePath ?? id });

    // Fetch the image as a Blob
    const response = await fetch(url);
    const blob = await response.blob();

    // Convert the Blob to a Data URL
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    await new Promise((resolve) => (reader.onloadend = resolve));

    // Use the Data URL as the image href
    const image = `<image href="${reader.result}" x="0" y="26" width="300" height="${height}" />`;
    const group = `<g x="0" y="0">${blockHeader}${image}</g>`;

    const svg = `<svg ${styleTag} ${style} viewBox="0 0 300 ${height}">${group}</svg>`;

    const svgBlob = new Blob([svg.toString()]);
    const element = document.createElement("a");
    element.download = `${id}.gizual.svg`;
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

  const headerHeight = 26;
  const footerHeight = 22;
  const footerTextPadding = 8;

  const headerWithContentHeight = height + headerHeight;
  const totalHeight = headerWithContentHeight + (isTruncated ? footerHeight : 0);

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
        id={id}
        height={height}
        url={url}
        blockRef={ref}
        isPreview={isPreview}
        filePath={filePath}
        fileType={fileType}
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
            height={footerHeight}
            style={{ fill: useStyleFn("--background-tertiary") }}
          />
          <text
            x={150}
            y={totalHeight - footerTextPadding}
            textAnchor="middle"
            style={{ fontSize: 12, lineHeight: 16, fill: useStyleFn("--foreground-primary") }}
          >
            Content truncated
          </text>
        </g>
      )}
    </svg>
  );
};

type FileBlockSvgProps = {
  id: string;
  height: number;
  url: string;
  blockRef?: React.RefObject<any>;
  isPreview?: boolean;
  filePath?: string;
  fileType?: FileIcon | undefined;
  transform?: { x: number; y: number };
  interactive?: boolean;
  noForeignObjects?: boolean;
  onExportSvg?: () => void;
  onExportRaw?: () => void;
};

function FileBlockSvg({
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
}: FileBlockSvgProps) {
  return (
    <g x={transform?.x} y={transform?.y}>
      <image
        className="svg-block-image"
        href={url}
        ref={blockRef}
        x={0}
        y={26}
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
    </g>
  );
}

// ---------------------------------------------
// -------------- BLOCK HEADER -----------------
// ---------------------------------------------

// Config constants for SVG header
const TITLE_HEIGHT = 26;
const TITLE_MAX_WIDTH = 180;
const BLOCK_WIDTH = 300;
const PADDING_CONTAINER = 4;
const ICON_SIZE = 26;
const BUTTON_SIZE = 24;
const BUTTON_GAP = 4;

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
 * @deprecated Use the new SVG block header instead.
 */
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

function generateBlockHeader({
  useStyleFn,
  noForeignObjects,
  path,
}: {
  useStyleFn: (key: string) => string;
  noForeignObjects?: boolean;
  path: string;
}) {
  const headerBg = new SvgRectElement({
    x: 0,
    y: 0,
    width: BLOCK_WIDTH,
    height: TITLE_HEIGHT,
    fill: useStyleFn("--background-tertiary"),
  });

  const hr = new SvgRectElement({
    x: 0,
    y: TITLE_HEIGHT,
    width: BLOCK_WIDTH,
    height: 1,
    fill: useStyleFn("--border-primary"),
  });

  const text = new SvgTextElement(
    truncateSmart(path, maxCharactersThatFitInWidth(TITLE_MAX_WIDTH, 10)),
    {
      x: PADDING_CONTAINER + (noForeignObjects ? 0 : ICON_SIZE),
      y: 16,
      fontSize: "10",
      lineHeight: "14",
      fill: useStyleFn("--foreground-primary"),
    },
  );

  const group = new SvgGroupElement(0, 0, 300, 26);
  group.assignChildren(headerBg, hr, text);
  return group.render();
}

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
  return (
    <>
      <g
        className="svg-block-header-group"
        style={{ fontFamily: noForeignObjects ? "Courier New" : "Iosevka Extended" }}
      >
        <g
          dangerouslySetInnerHTML={{
            __html: generateBlockHeader({ useStyleFn: useStyle, noForeignObjects, path }),
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
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  display: "inline-block",
                  fontSize: "18px",
                  lineHeight: "24px",
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
                gap: BUTTON_GAP,
                width: "100%",
                height: "100%",
              }}
            >
              <Menu withArrow position="bottom">
                <Menu.Target>
                  <IconButton
                    onClick={() => console.log("hi there")}
                    style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, padding: 0 }}
                  >
                    <IconDownload className={clsx(sharedStyle.Pointer, style.FileIcon)} />
                  </IconButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={onExportRaw}>Download raw file content</Menu.Item>

                  <Menu.Item disabled onClick={onExportSvg}>
                    Export visualization as SVG
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <DialogProvider
                trigger={
                  <IconButton
                    onClick={() => console.log("hi there")}
                    style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, padding: 0 }}
                  >
                    <IconSource className={style.FileIcon} />
                  </IconButton>
                }
                title={`${truncateSmart(path, 80)} (Read-Only)`}
                contentClassName={style.EditorDialog}
              >
                <BlockEditor path={path} />
              </DialogProvider>
            </div>
          </foreignObject>
        )}
      </g>
    </>
  );
}

function BlockEditor({ path }: { path: string }) {
  const { data, isLoading } = useFileContent(path);

  return <Editor fileContent={data} isLoading={isLoading} />;
}

export { FileBlock, FileBlockSvg, generateBlockHeader };

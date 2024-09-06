import { maxCharactersThatFitInWidth } from "@app/utils/fonts";
import { SvgGroupElement, SvgRectElement, SvgTextElement } from "@app/utils/svg";
import { truncateSmart } from "@app/utils/text";

export const HEADER_HEIGHT = 20;
export const FOOTER_HEIGHT = 22;
export const FOOTER_TEXT_PADDING = 8;

// Config constants for SVG header
export const TITLE_HEIGHT = HEADER_HEIGHT;
export const TITLE_MAX_WIDTH = 180;
export const BLOCK_WIDTH = 300;
export const PADDING_CONTAINER = 4;
export const ICON_SIZE = 20;
export const BUTTON_SIZE = 16;
export const BUTTON_GAP = 4;

export function generateBlockHeader({
  useStyleFn,
  noForeignObjects,
  path,
  maxTextWidth,
}: {
  useStyleFn: (key: string) => string;
  noForeignObjects?: boolean;
  path: string;
  maxTextWidth?: number;
}) {
  const headerBg = new SvgRectElement({
    x: 0,
    y: 0,
    width: BLOCK_WIDTH,
    height: TITLE_HEIGHT,
    fill: useStyleFn("--background-secondary"),
  });

  const hr = new SvgRectElement({
    x: 0,
    y: TITLE_HEIGHT,
    width: BLOCK_WIDTH,
    height: 1,
    fill: useStyleFn("--border-primary"),
  });

  const text = new SvgTextElement(
    truncateSmart(path, maxCharactersThatFitInWidth(maxTextWidth ?? TITLE_MAX_WIDTH, 10)),
    {
      x: PADDING_CONTAINER + (noForeignObjects ? 0 : ICON_SIZE),
      y: 14,
      fontSize: "9",
      lineHeight: "12",
      fill: useStyleFn("--foreground-primary"),
    },
  );

  const group = new SvgGroupElement(0, 0, 300, TITLE_HEIGHT);
  group.assignChildren(headerBg, hr, text);
  return group;
}

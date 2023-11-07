let MIN_FONT_SIZE: number | undefined;

export function estimateTextWidth(text: string, fontSizePx: number): number {
  const iosevkaGlyphWidthBase = 9.6; // The size of a single glyph in Iosevka at 16px font-size.
  const fontSize = pxToRem(Math.max(fontSizePx, getMinimumBrowserFontSize()));

  return text.length * iosevkaGlyphWidthBase * fontSize;
}

export function maxCharactersThatFitInWidth(width: number, fontSizePx: number): number {
  const iosevkaGlyphWidthBase = 9.6; // The size of a single glyph in Iosevka at 16px font-size.
  const fontSize = pxToRem(Math.max(fontSizePx, getMinimumBrowserFontSize()));

  return Math.floor(width / (iosevkaGlyphWidthBase * fontSize));
}

function _remToPx(rem: number): number {
  return rem * 16;
}

function pxToRem(px: number): number {
  return px / 16;
}

export function getMinimumBrowserFontSize() {
  if (MIN_FONT_SIZE !== undefined) return MIN_FONT_SIZE;
  const testElement = document.createElement("div");
  testElement.style.fontSize = "1px";
  document.body.append(testElement);
  const minSizeString = getComputedStyle(testElement).fontSize;
  const actualMinSizeInPx = minSizeString.slice(0, -2);

  testElement.remove();
  MIN_FONT_SIZE = Number(actualMinSizeInPx);
  return MIN_FONT_SIZE;
}

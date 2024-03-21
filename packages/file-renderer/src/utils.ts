import ejs from "ejs";

import { BAND_COLOR_RANGE, getBandColorScale } from "@giz/color-manager";

import { InternalContextItems, RendererContext } from "./types";

export function interpolateBandColor(values: string[], value: string) {
  return getBandColorScale(values, BAND_COLOR_RANGE)(value);
}

export function calculateDimensions(dpr: number, rect: DOMRect) {
  const width = rect.width * dpr;
  const height = rect.height * dpr;
  return { width, height };
}

export function parseEjsTemplate(ctx: RendererContext) {
  const { ejsTemplate: template } = ctx;
  if (!template) return;

  let ejsContext = {};

  // Populate with all "allowed" context items that are not functions or internal.
  for (const [key, value] of Object.entries(ctx).filter(
    ([key, value]) => typeof value !== "function" && !InternalContextItems.includes(key as any),
  )) {
    ejsContext = {
      ...ejsContext,
      [key]: value,
    };
  }

  // Shift the context one level up to make it accessible in the template.
  ejsContext = { _: { ...ejsContext } };

  const ejsResult = ejs.render(template, ejsContext);
  // eslint-disable-next-line no-console
  console.log(
    "`parseEjsTemplate` (template, ctx, result)",
    template,
    ctx,
    ejsResult,
  ); /* TODO: Remove log */
  return ejsResult;
}

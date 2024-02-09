import { SvgAttributes } from "@app/utils/svg";

import {
  AnnotationContext,
  AnnotationObject,
  BaseRenderer,
  evaluateTransform,
  RectAnnotation,
  TextAnnotation,
} from "./base";

/**
 * Renders annotations for the specified context onto a separate HTML layer.
 * Assign the output of this renderer to a HTML `div` element's `innerHTML` property.
 */
export class AnnotationRenderer implements BaseRenderer {
  annotations?: AnnotationObject[];
  transform = { x: 0, y: 0 };
  dpr = 1;

  prepareContext(_width: number, _height: number, dpr?: number | undefined): void {
    this.annotations = [];
    this.dpr = dpr ?? 1;
    this.applyTransform(0, -2.2 * (dpr ?? 1));
  }
  assignContext(_ctx: AnnotationObject[]): void {
    this.annotations = _ctx;
  }
  getContext(): AnnotationObject[] | undefined {
    return this.annotations;
  }
  getReturnValue(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!this.annotations) {
        reject("No annotations found.");
        return;
      }

      resolve(this.parseAnnotationsToHtml());
    });
  }
  applyTransform(x: number, y: number): void {
    this.transform = { x, y };
  }
  drawRect(attr: SvgAttributes, ctx: AnnotationContext): void {
    const { x, y } = evaluateTransform(attr.x, attr.y, this.transform);
    const rect: RectAnnotation = {
      x,
      y,
      height: attr.height ?? 0,
      width: attr.width ?? 0,
      color: attr.fill ?? "#000",
      ctx,
    };

    this.annotations?.push(rect);
  }
  drawText(text: string, attr: SvgAttributes, ctx: AnnotationContext): void {
    const { x, y } = evaluateTransform(attr.x, attr.y, this.transform);

    const fontSize = Number(attr.fontSize) ?? 12;
    const annotation: TextAnnotation = {
      text,
      x,
      y,
      fontSize,
      ctx,
    };

    this.annotations?.push(annotation);
  }
  parseAnnotationsToHtml(): string {
    if (!this.annotations) return "";
    let html =
      "<div style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; line-height: normal; user-select: none'>";
    for (const annotation of this.annotations) {
      if ("text" in annotation) {
        const posX = (annotation.x + this.transform.x) / this.dpr;
        const posY = (annotation.y + this.transform.y) / this.dpr;

        html += `<pre class="annotation" style="position: absolute; left: ${posX}px; top: ${posY}px; font-size: ${annotation.fontSize}px">${annotation.text}</pre>`;
      }
    }
    return html;
  }
}

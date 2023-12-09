import { SvgAttributes } from "@app/utils/svg";

import {
  AnnotationContext,
  AnnotationObject,
  AnnotationRect,
  AnnotationText,
  BaseRenderer,
  evaluateTransform,
} from "./base";

export class AnnotationRenderer implements BaseRenderer {
  annotations?: AnnotationObject[];
  transform = { x: 0, y: 0 };

  prepareContext(_width: number, _height: number, _dpr?: number | undefined): void {
    this.annotations = [];
  }
  assignContext(_ctx: AnnotationObject[]): void {
    this.annotations = _ctx;
  }
  getContext(): AnnotationObject[] | undefined {
    return this.annotations;
  }
  getReturnValue(): Promise<AnnotationObject[]> {
    return new Promise<AnnotationObject[]>((resolve, reject) => {
      if (!this.annotations) {
        reject("No annotations found.");
        return;
      }

      resolve(this.annotations);
    });
  }
  applyTransform(x: number, y: number): void {
    this.transform = { x, y };
  }
  drawRect(attr: SvgAttributes, ctx: AnnotationContext): void {
    const { x, y } = evaluateTransform(attr.x, attr.y, this.transform);
    const rect: AnnotationRect = {
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
    const annotation: AnnotationText = {
      text,
      x,
      y,
      fontSize,
      ctx,
    };

    this.annotations?.push(annotation);
  }
}

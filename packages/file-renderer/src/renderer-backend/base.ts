import { SvgAttributes, SvgElement } from "@app/utils/svg";

export type AnnotationContext = Object;

export type RectAnnotation = {
  width: number;
  height: number;
  x: number;
  y: number;
  color: string;
  ctx: AnnotationContext;
};

export type TextAnnotation = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  ctx: AnnotationContext;
};

export type AnnotationObject = TextAnnotation | RectAnnotation;

export type ValidContext = OffscreenCanvas | SvgElement | AnnotationObject[];

export interface BaseRenderer {
  prepareContext(width: number, height: number, dpr?: number): void;
  assignContext(ctx: ValidContext): void;
  getContext(): ValidContext | undefined;
  getReturnValue(): Promise<string | string[]>;

  applyTransform(x: number, y: number): void;
  drawRect(attr: SvgAttributes, annotationCtx?: AnnotationContext): void;
  drawText(text: string, attr: SvgAttributes, annotationCtx?: AnnotationContext): void;
}

export function evaluateTransform(
  x: number,
  y: number,
  transform: { x: number; y: number },
): { x: number; y: number } {
  return { x: x + transform.x, y: y + transform.y };
}

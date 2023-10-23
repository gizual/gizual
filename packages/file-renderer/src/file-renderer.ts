import { SvgAttributes, SvgBaseElement, SvgRectElement } from "@giz/gizual-app/utils";

export const VisualizationDefaults = {
  maxLineLength: 120,
  lineSpacing: 0,
  maxLineCount: 100,
};

export type SvgElement = {
  head: string;
  tail: string;
  children?: SvgBaseElement[];
};

export interface FileRenderer {
  prepareContext(width: number, height: number, dpr?: number): void;
  assignContext(ctx: OffscreenCanvas | SvgElement): void;
  getContext(): OffscreenCanvas | SvgElement | undefined;
  getReturnValue(): Promise<string | SvgBaseElement[]>;

  applyTransform(x: number, y: number): void;
  drawRect(attr: SvgAttributes): void;
  drawText(text: string, attr: SvgAttributes): void;
}

export class CanvasRenderer implements FileRenderer {
  canvas?: OffscreenCanvas;
  ctx?: OffscreenCanvasRenderingContext2D;
  dpr = 0;
  transform = { x: 0, y: 0 };

  prepareContext(width: number, height: number, dpr = 0) {
    this.canvas = new OffscreenCanvas(width * dpr, height * dpr);
    this.dpr = dpr;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context could not be initialized properly.");
    }

    //ctx.scale(dpr, dpr);
    this.ctx = ctx;
  }

  assignContext(ctx: OffscreenCanvas): void {
    this.canvas = ctx;
  }

  getContext(): OffscreenCanvas | undefined {
    return this.canvas;
  }

  async getReturnValue(): Promise<string> {
    if (!this.canvas) throw new Error("Drawing context was not initialized.");
    const blob = await this.canvas.convertToBlob();
    const url = URL.createObjectURL(blob);
    return url;
  }

  applyTransform(x: number, y: number): void {
    this.transform = { x, y };
  }

  drawRect(attr: SvgAttributes) {
    if (!this.canvas || !this.ctx) throw new Error("Drawing context was not initialized.");
    this.ctx.fillStyle = attr.fill ?? "#000000";
    this.ctx.fillRect(attr.x, attr.y, attr.width ?? 0, attr.height ?? 0);
  }

  drawText(text: string, attr: SvgAttributes) {
    if (!this.canvas || !this.ctx) throw new Error("Drawing context was not initialized.");
    this.ctx.font = `${Number(attr.fontSize) * this.dpr ?? 12 * this.dpr}px Iosevka Extended`;
    this.ctx.fillStyle = attr.fill ?? "#000000";
    this.ctx.fillText(text, attr.x, attr.y);
  }
}

//@logAllMethods("SvgRenderer", "#9c94d6")
export class SvgRenderer implements FileRenderer {
  svg?: SvgElement;
  transform = { x: 0, y: 0 };
  svgContent?: SvgBaseElement[];

  prepareContext(width: number, height: number): void {
    this.svg = {
      head: `<svg viewBox=0 0 ${width} ${height}>`,
      tail: "</svg>",
    };
    this.svgContent = [];
  }

  applyTransform(x: number, y: number): void {
    this.transform = { x, y };
    const g = new SvgBaseElement("g");
    g.transform = { x, y };
    if (this.svgContent?.length === 0) {
      this.svgContent = [g];
      return;
    }

    if (this.svgContent && this.svgContent.length > 0) g.assignChildren(...this.svgContent);
    this.svgContent = [g];
  }

  assignContext(ctx: SvgElement): void {
    this.svg = ctx;
  }

  getContext(): SvgElement | undefined {
    if (!this.svg) return;
    return { ...this.svg, children: this.svgContent };
  }

  async getReturnValue(): Promise<SvgBaseElement[]> {
    if (!this.svg) throw new Error("Drawing context was not initialized.");
    if (!this.svgContent) throw new Error("SVG has no content. Aborting.");
    return this.svgContent;
  }

  drawRect(attr: SvgAttributes): SvgBaseElement {
    if (!this.svg || !this.svgContent) throw new Error("Drawing context was not initialized.");
    const rect = new SvgRectElement(attr);
    this.svgContent.push(rect);
    return rect;
  }

  // This is a no-op for now, since embedding code into an SVG is awkward (we need to escape all tags, HTML special characters, etc.)
  drawText(_text: string, _attr: SvgAttributes) {
    //if (!this.svg || !this.svgContent) throw new Error("Drawing context was not initialized.");
    //const t = new SvgTextElement(text, attr);
    //this.svgContent.push(t);
    //return t;
  }
}

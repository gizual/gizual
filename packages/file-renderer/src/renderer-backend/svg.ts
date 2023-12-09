import { SvgAttributes, SvgBaseElement, SvgElement, SvgRectElement } from "@app/utils/svg";

import { BaseRenderer } from "./base";

export class SvgRenderer implements BaseRenderer {
  svg?: SvgElement;
  transform = { x: 0, y: 0 };
  svgContent?: SvgBaseElement[];

  prepareContext(width: number, height: number): void {
    this.svg = {
      head: `<svg viewBox=0 0 ${width} ${height} font="Courier New">`,
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

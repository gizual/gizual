import { SvgAttributes } from "@app/utils";

import { BaseRenderer, evaluateTransform } from "./base";

export class CanvasRenderer implements BaseRenderer {
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

    // We try to use WebP, but the browser will fall back to PNG if it's not supported.
    // Safari doesn't support WebP here, see:
    // https://caniuse.com/mdn-api_offscreencanvas_converttoblob_option_type_parameter_webp
    const blob = await this.canvas.convertToBlob({ type: "image/webp" });
    const url = URL.createObjectURL(blob);
    return url;
  }

  applyTransform(x: number, y: number): void {
    this.transform = { x, y };
  }

  drawRect(attr: SvgAttributes) {
    if (!this.canvas || !this.ctx) throw new Error("Drawing context was not initialized.");
    const { x, y } = evaluateTransform(attr.x, attr.y, this.transform);

    if (attr.fill) {
      this.ctx.fillStyle = attr.fill;
      this.ctx.fillRect(x, y, attr.width ?? 0, attr.height ?? 0);
    }
    if (attr.stroke && attr.strokeWidth) {
      this.ctx.strokeStyle = attr.stroke;
      this.ctx.lineWidth = Number(attr.strokeWidth);
      this.ctx.rect(x, y, attr.width ?? 0, attr.height ?? 0);
      this.ctx.stroke();
    }
  }

  drawText(text: string, attr: SvgAttributes) {
    if (!this.canvas || !this.ctx) throw new Error("Drawing context was not initialized.");
    const { x, y } = evaluateTransform(attr.x, attr.y, this.transform);

    this.ctx.font = `${Number(attr.fontSize) * this.dpr ?? 12 * this.dpr}px Iosevka Extended`;
    this.ctx.fillStyle = attr.fill ?? "#000000";
    this.ctx.fillText(text, x, y);
  }
}

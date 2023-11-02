export type SvgElement = {
  head: string;
  tail: string;
  children?: SvgBaseElement[];
};

export class SvgBaseElement {
  protected _tag: string;
  protected _children: SvgBaseElement[];
  protected _pos: { x: number; y: number };
  protected _size: { width?: number; height?: number };
  protected _transform: { x: number; y: number } = { x: 0, y: 0 };
  protected _fill = "#000000";
  protected _stroke = "#000000";
  protected _strokeWidth = "1";

  constructor(tag: string) {
    this._tag = tag;
    this._children = [];
    this._pos = { x: 0, y: 0 };
    this._size = { width: 0, height: 0 };
  }

  render(): string {
    if (this._children.length === 0)
      return `<${this._tag} ${this.attributes} ${this.transformString}/>`;

    return `<${this._tag} ${this.attributes} ${this.transformString}>${this._children
      .map((c) => c.render())
      .join("")}</${this._tag}>`;
  }

  assignChildren(...children: SvgBaseElement[]) {
    this._children = children;
  }

  addChild(child: SvgBaseElement) {
    this._children.push(child);
  }

  set x(x: number) {
    this._pos.x = x;
  }

  set y(y: number) {
    this._pos.y = y;
  }

  set transform(t: { x: number; y: number }) {
    this._transform = t;
  }

  get transformString(): string {
    return `transform="translate(${this._transform.x},${this._transform.y})"`;
  }

  set pos(v: { x: number; y: number }) {
    this._pos = v;
  }

  get posString() {
    return `x="${this._pos.x}" y="${this._pos.y}"`;
  }

  set size(v: { width?: number; height?: number }) {
    this._size = v;
  }

  get sizeString() {
    const width = this._size.width ? `width="${this._size.width}"` : undefined;
    const height = this._size.height ? `height="${this._size.height}"` : undefined;
    return [width, height].join(" ");
  }

  set strokeWidth(v: string) {
    this._strokeWidth = v;
  }

  get strokeWidth() {
    return `strokeWidth="${this._strokeWidth}"`;
  }

  set fill(v: string) {
    this._fill = v;
  }

  get fill() {
    return `fill="${this._fill}"`;
  }

  set stroke(v: string) {
    this._stroke = v;
  }

  get stroke() {
    return `stroke="${this._stroke}"`;
  }

  get attributes(): string {
    return [this.posString, this.sizeString, this.strokeWidth, this.fill, this.stroke].join(" ");
  }
}

export class SvgGroupElement extends SvgBaseElement {
  constructor(x: number, y: number, width: number, height: number) {
    super("g");
    this.pos = { x, y };
    this.size = { width, height };
  }
}

export type SvgAttributes = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  fontSize?: string;
};

export class SvgGraphicsElement extends SvgBaseElement {
  constructor(tag: string, attributes: SvgAttributes) {
    super(tag);
    this.pos = { x: attributes.x, y: attributes.y };
    this.size = { width: attributes.width, height: attributes.height };
    this.fill = attributes.fill ?? "#000000";
    this.stroke = attributes.stroke ?? "transparent";
    this.strokeWidth = attributes.strokeWidth ?? "0";
  }
}

export class SvgRectElement extends SvgGraphicsElement {
  constructor(attributes: SvgAttributes) {
    super("rect", attributes);
  }
}

export class SvgTextElement extends SvgGraphicsElement {
  text: string;
  fontSize: string;

  constructor(text: string, attributes: SvgAttributes) {
    super("text", attributes);
    this.text = text;
    this.fontSize = attributes.fontSize ?? "12";
  }

  render(): string {
    return `<${this._tag} ${this.attributes} ${this.transformString}>${this.text}</${this._tag}>`;
  }
}

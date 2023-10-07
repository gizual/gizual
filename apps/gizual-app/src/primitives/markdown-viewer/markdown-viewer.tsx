import { isPromise } from "@app/utils";
import React from "react";
import ReactMarkdown from "react-markdown";

import style from "./markdown-viewer.module.scss";

export type MarkdownViewerProps = {
  src: string | Promise<string>;
};

export function MarkdownViewer({ src }: MarkdownViewerProps) {
  const [content, setContent] = React.useState(typeof src === "string" ? src : "");

  if (isPromise(src)) src.then((resolved) => setContent(resolved));
  if (!content) return <></>;

  return <ReactMarkdown className={style.markdownContent}>{content}</ReactMarkdown>;
}

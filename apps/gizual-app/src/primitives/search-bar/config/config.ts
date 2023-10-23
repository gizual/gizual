import { StreamLanguage } from "@codemirror/language";
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { tags as t } from "@lezer/highlight";
import createTheme from "@uiw/codemirror-themes";

import { AvailableTagIdsForRegexp, TAG_PREFIX } from "../search-tags";

export const searchBarTheme = createTheme({
  theme: "dark",
  settings: {
    fontFamily: "Iosevka Extended",
    background: "var(--background-tertiary)",
    foreground: "var(--text-primary)",
    caret: "var(--text-secondary)",
    selection: "var(--background-primary)",
    selectionMatch: "var(--background-primary)",
    lineHighlight: "transparent",
    gutterBackground: "transparent",
    gutterForeground: "transparent",
  },
  styles: [
    {
      tag: t.tagName,
      color: "var(--accent-main)",
      backgroundColor: "#0c0c0d40",
      padding: "0.125rem 0 0.125rem 0",
      borderTopLeftRadius: "0.25rem",
      borderBottomLeftRadius: "0.25rem",
    },
    {
      tag: t.emphasis,
      backgroundColor: "#0c0c0d40",
      padding: "0.125rem 0 0.125rem 0",
      borderTopRightRadius: "0.25rem",
      borderBottomRightRadius: "0.25rem",
    },
    { tag: t.annotation, textDecoration: "underline red" },
    { tag: t.operator, fontWeight: "bold", color: "var(--accent-tertiary)" },
  ],
});

export const searchBarSyntaxSimple = StreamLanguage.define(
  simpleMode({
    start: [
      {
        regex: new RegExp(TAG_PREFIX + "\\b(" + AvailableTagIdsForRegexp + ")\\b(?=:)"),
        token: "tag",
        next: "tagged",
      },
      { regex: /\b(AND|OR|NOT)\b/, token: "operator" },
      { regex: /\b(\w+)\b(?=:)/, token: "annotation", next: "tagged" }, // mark unsupported tokens as annotations (errors)
      { regex: /./, token: "text" },
    ],
    tagged: [
      { regex: /:"([^"\\]*(?:\\.[^"\\]*)*)"/, token: "emphasis", next: "start" },
      { regex: /:(\S+)/, token: "emphasis", next: "start" },
      { regex: /./, token: "text" },
    ],
  }),
);

/// <reference types="vite-plugin-svgr/client" />

import { StreamLanguage } from "@codemirror/language";
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import createTheme from "@uiw/codemirror-themes";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as TreeIcon } from "../../assets/icons/file-tree.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings.svg";
import { IconButton } from "../icon-button";

import style from "./search-bar.module.scss";
import { AvailableTags, SearchBarViewModel } from "./search-bar.vm";

const myTheme = createTheme({
  theme: "dark",
  settings: {
    background: "var(--background-secondary)",
    foreground: "var(--text-primary)",
    caret: "var(--text-secondary)",
    selection: "var(--border-primary)",
    selectionMatch: "var(--border-primary)",
    lineHighlight: "transparent",
    gutterBackground: "transparent",
    gutterForeground: "transparent",
  },
  styles: [
    {
      tag: t.tagName,
      color: "var(--accent-main)",
      backgroundColor: "var(--background-tertiary)",
      padding: "0.125rem 0 0.125rem 0.25rem",
      borderTopLeftRadius: "0.25rem",
      borderBottomLeftRadius: "0.25rem",
    },
    {
      tag: t.emphasis,
      backgroundColor: "var(--background-tertiary)",
      padding: "0.125rem 0.25rem 0.125rem 0",
      borderTopRightRadius: "0.25rem",
      borderBottomRightRadius: "0.25rem",
    },
    { tag: t.annotation, textDecoration: "underline red" },
    { tag: t.operator, fontWeight: "bold", color: "var(--accent-tertiary)" },
  ],
});

const customParser = StreamLanguage.define(
  simpleMode({
    start: [
      { regex: /\b(file|author|from|to)\b(?=:)/, token: "tag", next: "tagged" },
      { regex: /\b(AND|OR|NOT)\b/, token: "operator" },
      { regex: /\b(\w+)\b(?=:)/, token: "annotation", next: "tagged" }, // mark unsupported tokens as annotations (errors)
      { regex: /./, token: "text" },
    ],
    tagged: [
      { regex: /:"([^"\\]*(?:\\.[^"\\]*)*)"/, token: "emphasis", next: "start" },
      { regex: /:(\S+)/, token: "emphasis", next: "start" },
      { regex: /./, token: "text" },
    ],
  })
);

export type SearchBarProps = {
  vm: SearchBarViewModel;
};

function SearchBar({ vm }: SearchBarProps) {
  return (
    <div className={style.searchBar}>
      <div className={style.content}>
        <IconButton onClick={vm.onToggleRepoPanel}>
          <TreeIcon />
        </IconButton>
        <div id="inputWrapper" className={style.searchInputWrapper}>
          <SearchInput vm={vm} />
        </div>
        <IconButton onClick={vm.onToggleSettingsPanel}>
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
}

const SearchInput = observer(({ vm }: SearchBarProps) => {
  const ref = React.useRef<ReactCodeMirrorRef>(null);

  const customKeymap = keymap.of([
    {
      key: "Enter",
      run: (view) => {
        vm.search();
        view.contentDOM.blur();
        return true;
      },
    },
  ]);

  React.useEffect(() => {
    if (ref.current) {
      vm.assignSearchBarRef(ref);
    }
  }, [ref]);

  return (
    <div className={style.inputFieldWrapper}>
      <CodeMirror
        ref={ref}
        className={style.searchInput}
        onFocus={vm.onSearchBarFocus}
        onBlur={vm.onSearchBarBlur}
        onChange={vm.onSearchInput}
        value={vm.searchInput}
        basicSetup={{
          lineNumbers: false,
          autocompletion: false,
          highlightActiveLine: false,
          defaultKeymap: false,
          foldGutter: true,
        }}
        extensions={[customKeymap, customParser]}
        width={"100%"}
        style={{ margin: "auto" }}
        theme={myTheme}
      />
      {vm.isPopoverVisible && (
        <div className={style.searchOverlay}>
          <div className={style.searchOverlayContent}>
            <h4>Refine your search</h4>
            {AvailableTags.map((tag) => (
              <div
                className={style.searchOverlayHintEntry}
                key={tag.id}
                onClick={() => vm.appendTag(tag)}
                onMouseEnter={() => console.log("hover")}
              >
                <pre className={style.tag}>{tag.id}: </pre>
                <pre>{tag.hint}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <IconButton
        className={style.searchIcon}
        colored
        wide
        border="right"
        onClick={() => vm.search}
      >
        <SearchIcon />
      </IconButton>
    </div>
  );
});

export default observer(SearchBar);

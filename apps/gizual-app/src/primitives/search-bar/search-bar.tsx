/// <reference types="vite-plugin-svgr/client" />

import { useMainController } from "@app/controllers";
import { StreamLanguage } from "@codemirror/language";
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import createTheme from "@uiw/codemirror-themes";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";
import { createPortal } from "react-dom";

import { ReactComponent as GitBranchLine } from "../../assets/icons/git-branch-line.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";
import { Select } from "../select";

import style from "./search-bar.module.scss";
import { SearchBarViewModel } from "./search-bar.vm";
import { AvailableTagIdsForRegexp, AvailableTags, TAG_PREFIX } from "./search-tags";

const myTheme = createTheme({
  theme: "dark",
  settings: {
    fontFamily: "Iosevka Extended",
    background: "var(--background-secondary)",
    foreground: "var(--text-primary)",
    caret: "var(--text-secondary)",
    selection: "var(--background-tertiary)",
    selectionMatch: "var(--background-tertiary)",
    lineHighlight: "transparent",
    gutterBackground: "transparent",
    gutterForeground: "transparent",
  },
  styles: [
    {
      tag: t.tagName,
      color: "var(--accent-main)",
      backgroundColor: "#9898a940",
      padding: "0.125rem 0 0.125rem 0",
      borderTopLeftRadius: "0.25rem",
      borderBottomLeftRadius: "0.25rem",
    },
    {
      tag: t.emphasis,
      backgroundColor: "#9898a940",
      padding: "0.125rem 0 0.125rem 0",
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

export type SearchBarProps = {
  vm?: SearchBarViewModel;
};

export const SearchBar = observer(({ vm: externalVm }: SearchBarProps) => {
  const mainController = useMainController();

  const vm: SearchBarViewModel = React.useMemo(() => {
    return externalVm || new SearchBarViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.SearchBar}>
      <div className={style.Content}>
        <Select
          value={mainController.selectedBranch}
          style={{ paddingLeft: "1rem" }}
          componentStyle={{ width: 229, height: "100%", margin: "auto 0" }}
          onChange={(e) => {
            mainController.setBranchByName(e);
          }}
          size="large"
          options={mainController.branchNames.map((b) => {
            return { label: b, value: b };
          })}
          icon={<GitBranchLine />}
        />
        <div id="inputWrapper" className={style.SearchInputWrapper}>
          <SearchInput vm={vm} />
        </div>
      </div>
    </div>
  );
});

const SearchInput = observer(({ vm }: Required<SearchBarProps>) => {
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
    <div className={style.InputFieldWrapper}>
      <CodeMirror
        ref={ref}
        className={style.SearchInput}
        onFocus={vm.onSearchBarFocus}
        onBlur={vm.onSearchBarBlur}
        onChange={vm.onSearchInput}
        onUpdate={vm.onSearchUpdate}
        onCreateEditor={vm.onCreateEditor}
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
      {vm.isPopoverOpen && (
        <>
          {createPortal(
            <div
              id={"PopoverUnderlay"}
              className={clsx(sharedStyle.PopoverUnderlay, style.SearchPopoverUnderlay)}
              onClick={() => vm.search()}
            ></div>,
            document.body,
          )}
          <div className={style.SearchOverlay}>
            <div className={style.SearchOverlayContent}>
              <div className={style.SearchOverlayContentBox}>
                {!vm.currentPendingTag && (
                  <>
                    <h4>Refine your search</h4>
                    {Object.entries(AvailableTags).map(([id, tag]) => {
                      if (vm.tags.some((t) => t.tag.id === id))
                        return <React.Fragment key={id}></React.Fragment>;

                      return (
                        <div
                          className={style.SearchOverlayHintEntry}
                          key={id}
                          onClick={() => vm.appendTag(tag)}
                        >
                          <pre className={style.Tag}>-{tag.id}: </pre>
                          <pre className={style.Hint}>{tag.textHint}</pre>
                        </div>
                      );
                    })}
                  </>
                )}
                {vm.currentPendingTag && vm.currentPendingTag.tag.inputAssist}
              </div>
            </div>
          </div>
        </>
      )}

      <IconButton
        className={style.SearchIcon}
        coloured
        wide
        border="right"
        onClick={() => vm.search()}
        aria-label="Search"
      >
        <SearchIcon />
      </IconButton>
    </div>
  );
});

/// <reference types="vite-plugin-svgr/client" />

import { useMainController, useViewModelController } from "@app/controllers";
import { DATE_FORMAT } from "@app/utils";
import { StreamLanguage } from "@codemirror/language";
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";
import { keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import createTheme from "@uiw/codemirror-themes";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { DatePicker, DatePickerProps, Select, Tooltip } from "antd";
import clsx from "clsx";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import React from "react";
import { createPortal } from "react-dom";

import { ReactComponent as TreeIcon } from "../../assets/icons/file-tree.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings.svg";
import { ReactComponent as TrashIcon } from "../../assets/icons/trash.svg";
import sharedStyle from "../css/shared-styles.module.scss";
import { IconButton } from "../icon-button";

import style from "./search-bar.module.scss";
import {
  AvailableTagIdsForRegexp,
  AvailableTags,
  SearchBarViewModel,
  SelectedTag,
  TAG_PREFIX,
} from "./search-bar.vm";

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
  const vmController = useViewModelController();

  const vm: SearchBarViewModel = React.useMemo(() => {
    return externalVm || new SearchBarViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.searchBar}>
      <div className={style.content}>
        <Tooltip title={"Toggle repository panel"}>
          <IconButton
            onClick={vmController.toggleRepoPanelVisibility}
            aria-label="Toggle repository panel"
          >
            <TreeIcon />
          </IconButton>
        </Tooltip>
        <Select
          value={mainController.selectedBranch}
          style={{ width: 200, height: "100%", margin: "auto 0", paddingLeft: "1rem" }}
          onChange={(e) => {
            mainController.setBranchByName(e);
          }}
          size="large"
          options={mainController.branchNames.map((b) => {
            return { label: b, value: b };
          })}
        />
        <div id="inputWrapper" className={style.searchInputWrapper}>
          <SearchInput vm={vm} />
        </div>
        <Tooltip title={"Toggle settings panel"}>
          <IconButton
            onClick={vmController.toggleSettingsPanelVisibility}
            aria-label="Toggle settings panel"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
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
    <div className={style.inputFieldWrapper}>
      <CodeMirror
        ref={ref}
        className={style.searchInput}
        onFocus={vm.onSearchBarFocus}
        onBlur={vm.onSearchBarBlur}
        onChange={vm.onSearchInput}
        onUpdate={vm.onSearchUpdate}
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
              className={sharedStyle.PopoverUnderlay}
              onClick={() => vm.search()}
            ></div>,
            document.body,
          )}
          <div className={style.searchOverlay}>
            <div className={style.searchOverlayContent}>
              {!vm.currentPendingTag && (
                <>
                  <h4>Refine your search</h4>
                  {Object.entries(AvailableTags).map(([id, tag]) => (
                    <div
                      className={style.searchOverlayHintEntry}
                      key={id}
                      onClick={() => vm.appendTag(tag)}
                    >
                      <pre className={style.tag}>-{tag.id}: </pre>
                      <pre>{tag.hint}</pre>
                    </div>
                  ))}
                </>
              )}
              {vm.currentPendingTag && vm.currentPendingTag.tag.id === "start" && (
                <DateTimeInputAssist vm={vm} tag={vm.currentPendingTag} />
              )}
              {vm.currentPendingTag && vm.currentPendingTag.tag.id === "end" && (
                <DateTimeInputAssist vm={vm} tag={vm.currentPendingTag} />
              )}
            </div>
          </div>
        </>
      )}

      <IconButton
        className={style.searchIcon}
        colored
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

const DateTimeInputAssist = observer(
  ({ vm, tag }: Required<SearchBarProps> & { tag: SelectedTag }) => {
    const onChange: DatePickerProps["onChange"] = (date, dateString) => {
      vm.updateTag(tag.tag.id, dateString);
    };

    let currentDate = dayjs(tag.value, DATE_FORMAT);
    if (!currentDate.isValid()) currentDate = dayjs();

    const defaultStartDate =
      vm._mainController.vmController.timelineViewModel?.defaultStartDate?.toString();

    const defaultEndDate =
      vm._mainController.vmController.timelineViewModel?.defaultEndDate?.toString();

    return (
      <>
        <div className={style.searchOverlayHintEntry}>
          {tag.tag.id === "start" && <p>Pick a custom start date: </p>}
          {tag.tag.id === "end" && <p>Pick a custom end date: </p>}
          <DatePicker onChange={onChange} format={DATE_FORMAT} size="small" />
        </div>
        {tag.tag.id === "start" && defaultStartDate && (
          <div
            className={style.searchOverlayHintEntry}
            onClick={() => {
              vm.updateTag(tag.tag.id, defaultStartDate);
            }}
          >
            <p>{`${defaultStartDate} (default)`}</p>
          </div>
        )}
        {tag.tag.id === "end" && defaultEndDate && (
          <div
            className={style.searchOverlayHintEntry}
            onClick={() => {
              vm.updateTag(tag.tag.id, defaultEndDate);
            }}
          >
            <p>{`${defaultEndDate} (default)`}</p>
          </div>
        )}
        <hr />
        <div
          className={clsx(style.searchOverlayHintEntry, style.removeTagEntry)}
          onClick={() => {
            vm.removeTag(tag);
          }}
        >
          <TrashIcon style={{ margin: 0 }} />
          <p>Remove Tag</p>
        </div>
      </>
    );
  },
);

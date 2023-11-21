/// <reference types="vite-plugin-svgr/client" />

import { IconCommandLine, IconGitBranchLine, IconSearch } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";
import { createPortal } from "react-dom";

import sharedStyle from "../css/shared-styles.module.scss";
import { DialogProvider } from "../dialog-provider";
import { IconButton } from "../icon-button";
import { Select } from "../select";

import { AdvancedEditor } from "./advanced/advanced-editor";
import { searchBarSyntaxSimple, searchBarTheme } from "./config";
import { CommonInputAssist } from "./panels/common-footer";
import style from "./search-bar.module.scss";
import { SearchBarViewModel } from "./search-bar.vm";

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
          icon={<IconGitBranchLine />}
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

  const customKeymap = Prec.highest(
    keymap.of([
      {
        key: "Enter",
        run: (view) => {
          vm.search();
          view.contentDOM.blur();
          return true;
        },
      },
      {
        key: "Escape",
        run: (view) => {
          console.log("Escape");
          view.contentDOM.blur();
          vm.closePopover();
          return true;
        },
      },
      {
        key: "Tab",
        run: (_view) => {
          console.log("Tab");
          return true;
        },
      },
      {
        key: "ArrowDown",
        run: (_view) => {
          console.log("ArrowDown");
          return true;
        },
      },
    ]),
  );

  React.useEffect(() => {
    if (ref.current) {
      vm.assignSearchBarRef(ref);
    }
  }, [ref]);

  return (
    <div className={style.InputFieldWrapper}>
      {
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
          extensions={[customKeymap, searchBarSyntaxSimple]}
          width={"100%"}
          style={{ margin: "auto", position: "relative" }}
          theme={searchBarTheme}
        >
          <DialogProvider
            title="Advanced Query Builder"
            trigger={
              <Tooltip title="Open advanced query builder">
                <IconButton aria-label="Advanced Query Builder">
                  <IconCommandLine className={style.AdvancedSearchIcon} />
                </IconButton>
              </Tooltip>
            }
            triggerClassName={undefined}
          >
            <AdvancedEditor vm={vm} />
          </DialogProvider>
        </CodeMirror>
      }
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
                    {vm.unusedTags.map((tag) => (
                      <div
                        className={style.SearchOverlayHintEntry}
                        key={tag.id}
                        onClick={() => vm.appendTag(tag)}
                      >
                        <pre className={style.Tag}>-{tag.id}: </pre>
                        <pre className={style.Hint}>{tag.textHint}</pre>
                      </div>
                    ))}
                  </>
                )}
                {vm.currentPendingTag && (
                  <React.Fragment key={vm.currentPendingTag.tag.id}>
                    {vm.currentPendingTag.tag.inputAssist}
                    <CommonInputAssist tagId={vm.currentPendingTag.tag.id} />
                  </React.Fragment>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <IconButton
        className={style.SearchIcon}
        colored
        wide
        border="right"
        onClick={() => vm.search()}
        aria-label="Search"
      >
        <IconSearch />
      </IconButton>
    </div>
  );
});

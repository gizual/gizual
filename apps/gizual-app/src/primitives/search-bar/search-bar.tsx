/// <reference types="vite-plugin-svgr/client" />

import * as Popover from "@radix-ui/react-popover";
import { observer } from "mobx-react-lite";

import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { ReactComponent as TreeIcon } from "../../assets/icons/file-tree.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings.svg";
import { IconButton } from "../icon-button";

import style from "./search-bar.module.scss";
import { SearchBarViewModel } from "./search-bar.vm";
import React from "react";

export type SearchBarProps = {
  vm: SearchBarViewModel;
};

function SearchBar({ vm }: SearchBarProps) {
  return (
    <Popover.Root open={vm.isPopoverVisible} modal>
      <div id="overlay"></div>
      <div className={style.searchBar}>
        <div className={style.content}>
          <IconButton onClick={vm.onToggleRepoPanel}>
            <TreeIcon />
          </IconButton>

          <Popover.Trigger asChild onClick={vm.openPopover}>
            <div className={style.searchInput}>
              <p className={style.queryParam}>-files</p>
              <p className={style.searchText}>: {vm.filesQuery}</p>
            </div>
          </Popover.Trigger>
          <SearchPanel vm={vm} />

          <IconButton
            className={style.searchIcon}
            colored
            wide
            border="right"
            onClick={() => console.log("SEARCH")}
          >
            <SearchIcon />
          </IconButton>
          <IconButton onClick={vm.onToggleSettingsPanel}>
            <SettingsIcon />
          </IconButton>
        </div>
      </div>
    </Popover.Root>
  );
}

type SearchPanelProps = {
  vm: SearchBarViewModel;
};

function SearchPanel({ vm }: SearchPanelProps) {
  // Ref for input files element
  const inputFilesRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    vm.assignInputFilesRef(inputFilesRef);
  }, [inputFilesRef]);

  return (
    <Popover.Portal>
      <Popover.Content className={style.PopoverContent} sideOffset={5}>
        <div className={style.PopoverContainer}>
          <h1>Query Builder</h1>
          <fieldset className={style.Fieldset}>
            <label className={style.Label} htmlFor="files">
              Files
            </label>
          </fieldset>
          <input
            className={style.Input}
            id="files"
            defaultValue={vm.filesQuery}
            placeholder="Enter files to search. Separate multiple files with a comma."
            ref={inputFilesRef}
          />
        </div>
        <Popover.Close className={style.PopoverClose} aria-label="Close" onClick={vm.closePopover}>
          <CloseIcon />
        </Popover.Close>
        <Popover.Arrow className={style.PopoverArrow} />
      </Popover.Content>
    </Popover.Portal>
  );
}

export default observer(SearchBar);

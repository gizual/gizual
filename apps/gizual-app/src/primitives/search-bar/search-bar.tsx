/// <reference types="vite-plugin-svgr/client" />

import { ReactComponent as TreeIcon } from "../../assets/icons/file-tree.svg";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings.svg";
import { IconButton } from "../icon-button";

import style from "./search-bar.module.scss";

export function SearchBar() {
  return (
    <div className={style.searchBar}>
      <div className={style.content}>
        <IconButton onClick={() => console.log("File Tree")}>
          <TreeIcon />
        </IconButton>
        <div className={style.searchInput}>
          <p className={style.queryParam}>-files</p>
          <p className={style.searchText}>: view-layer.tsx, main.tsx, app.tsx</p>
        </div>
        <IconButton
          className={style.searchIcon}
          colored
          wide
          border="right"
          onClick={() => console.log("123")}
        >
          <SearchIcon />
        </IconButton>
        <IconButton onClick={() => console.log("Settings")}>
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
}

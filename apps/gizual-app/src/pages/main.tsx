import { TitleBar } from "../primitives";
import { RepoPanel } from "../primitives/repo-panel";
import { SearchBar } from "../primitives/search-bar/search-bar";
import { SettingsPanel } from "../primitives/settings-panel";

import style from "./main.module.scss";

function MainPage() {
  return (
    <div className={style.page}>
      <div>
        <TitleBar />
        <SearchBar />
      </div>
      <div className={style.body}>
        <RepoPanel />
        <div className={style.canvas} />
        <SettingsPanel />
      </div>
    </div>
  );
}

export default MainPage;

import { TitleBar } from "../primitives";
import { RepoPanel } from "../primitives/repo-panel";
import { SearchBar } from "../primitives/search-bar/search-bar";

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
      </div>
    </div>
  );
}

export default MainPage;

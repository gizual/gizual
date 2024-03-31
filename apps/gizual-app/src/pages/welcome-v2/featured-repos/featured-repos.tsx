import style from "./featured-repos.module.scss";
import { RepoCard } from "./repo-card";

function FeaturedRepos() {
  return (
    <div className={style.FeaturedRepos}>
      <RepoCard
        repoName="tugraz-isds/diamond"
        repoSource="https://github.com/tugraz-isds/diamond"
      />
      <RepoCard repoName="ts-rest/ts-rest" repoSource="https://github.com/ts-rest/ts-rest" />
      <RepoCard repoName="pmndrs/zustand" repoSource="https://github.com/pmndrs/zustand" />
      <RepoCard repoName="mobxjs/mobx" repoSource="https://github.com/mobxjs/mobx" />
      <RepoCard repoName="vitejs/vite" repoSource="https://github.com/vitejs/vite" />
      <RepoCard repoName="vuejs/vue" repoSource="https://github.com/vuejs/vue" />
      <RepoCard repoName="flutter/flutter" repoSource="https://github.com/flutter/flutter" />
      <RepoCard repoName="facebook/react" repoSource="https://github.com/facebook/react" />
      <RepoCard repoName="microsoft/vscode" repoSource="https://github.com/microsoft/vscode" />
    </div>
  );
}

export { FeaturedRepos };

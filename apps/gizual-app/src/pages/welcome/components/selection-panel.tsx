import { IconFolder } from "@app/assets";
import shared from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";

import style from "../welcome.module.scss";
import { RepoSource } from "../welcome.vm";

import { CollapsiblePanel } from "./collapsible-panel";
import { OpenRow } from "./open-row";
import { RepoRow } from "./repo-row";

export type LeftPanelProps = {
  selectedSource?: RepoSource;
  setSelectedSource: (source: RepoSource) => void;
};

export function SelectionPanel({ selectedSource, setSelectedSource }: LeftPanelProps) {
  return (
    <div className={clsx(style.Column, shared.FlexColumn)}>
      <CollapsiblePanel title="Open Repository">
        <>
          <OpenRow
            title={"From local directory"}
            icon={<IconFolder />}
            supportedBy={["chromium"]}
            isSelected={selectedSource === "local"}
            onSelect={() => setSelectedSource("local")}
          />

          <OpenRow
            title={"From zip file"}
            icon={<IconFolder />}
            supportedBy={["chromium"]}
            isSelected={selectedSource === "zip"}
            onSelect={() => setSelectedSource("zip")}
          />

          <OpenRow
            title={"From URL"}
            icon={<IconFolder />}
            supportedBy={["chromium"]}
            isSelected={selectedSource === "url"}
            onSelect={() => setSelectedSource("url")}
          />
        </>
      </CollapsiblePanel>

      <CollapsiblePanel title="Featured Repositories">
        <>
          <RepoRow
            repoName="tugraz-isds/diamond"
            repoSource="https://github.com/tugraz-isds/diamond"
            source="url"
            metrics={{ forks: 6, stars: 2 }}
          />
          <hr />
          <RepoRow
            repoName="ts-rest/ts-rest"
            repoSource="https://github.com/ts-rest/ts-rest"
            source="url"
          />
          <hr />
          <RepoRow
            repoName="pmndrs/zustand"
            repoSource="https://github.com/pmndrs/zustand"
            source="url"
          />
          <hr />
          <RepoRow
            repoName="mobxjs/mobx"
            repoSource="https://github.com/mobxjs/mobx"
            source="url"
          />
          <hr />
          <RepoRow
            repoName="neovim/neovim"
            repoSource="https://github.com/neovim/neovim"
            source="url"
            metrics={{ forks: 5000, stars: 75_000 }}
          />
          <hr />
          <RepoRow
            repoName="vitejs/vite"
            repoSource="https://github.com/vitejs/vite"
            source="url"
            metrics={{ forks: 5600, stars: 64_000 }}
          />
          <hr />
          <RepoRow
            repoName="microsoft/vscode"
            repoSource="https://github.com/microsoft/vscode"
            source="url"
            metrics={{ forks: 27_000, stars: 157_000 }}
          />
          <hr />
          <RepoRow
            repoName="facebook/react"
            repoSource="https://github.com/facebook/react"
            source="url"
          />
          <hr />
          <RepoRow repoName="vuejs/vue" repoSource="https://github.com/vuejs/vue" source="url" />
          <hr />
          <RepoRow
            repoName="flutter/flutter"
            repoSource="https://github.com/flutter/flutter"
            source="url"
          />
          <hr />
          <RepoRow repoName="golang/go" repoSource="https://github.com/golang/go" source="url" />
          <hr />
          <RepoRow
            repoName="home-assistant/core"
            repoSource="https://github.com/home-assistant/core"
            source="url"
          />
        </>
      </CollapsiblePanel>

      {/*<CollapsiblePanel title="Recent Repositories">
        <>
          <RepoRow
            repoName="gizual"
            repoSource="fsa://123123123123fff"
            source="local"
            metrics={{ forks: 64_000, stars: 20_400 }}
          />
          <hr />
          <RepoRow
            repoName="neovim"
            repoSource="url://github.com/neovim"
            source="url"
            metrics={{ forks: 64_000, stars: 20_400 }}
          />
        </>
    </CollapsiblePanel>*/}
    </div>
  );
}

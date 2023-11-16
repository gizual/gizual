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
            repoName="neovim"
            repoSource="url://github.com/neovim"
            source="url"
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
      </CollapsiblePanel>

      <CollapsiblePanel title="Recent Repositories">
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
      </CollapsiblePanel>
    </div>
  );
}

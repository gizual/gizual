import {
  Collapse,
  IconAndroid,
  IconChromium,
  IconEarth,
  IconFirefox,
  IconFolder,
  IconFolderZip,
  IconIos,
  IconSafari,
} from "@app/assets";
import { useMainController } from "@app/controllers";
import { TitleBar } from "@app/primitives";
import { useWindowSize } from "@app/utils";
import { Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import style from "./welcome.module.scss";

export const WelcomePage = observer(() => {
  const mainController = useMainController();
  const [width, _] = useWindowSize();
  const isLargeScreen = width > 1200;

  return (
    <div className={style.Page}>
      <div className={style.TitleBarContainer}>
        <TitleBar />
      </div>

      <div className={style.Body}>
        <div className={style.SplitPanel}>
          <div className={style.Column}>
            <CollapsiblePanel title="Open from folder">
              <>
                <OpenRow
                  title="From local file system"
                  icon={<IconFolder />}
                  supportedBy={["chromium"]}
                />
                <OpenRow title="From .zip" icon={<IconFolderZip />} supportedBy={["chromium"]} />
                <OpenRow title="From URL" icon={<IconEarth />} supportedBy={["chromium"]} />
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
          <div className={style.VerticalRule}></div>
          <div className={clsx(style.DetailColumn, style.Grow)}>
            <h1 className={style.DetailHeader}>Open from local file system</h1>
            <p className={style.DetailDescription}>
              Gorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie,
              dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem
              sollicitudin lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum
              velit, sit amet feugiat lectus. Class aptent taciti sociosqu ad litora torquent per
              conubia nostra, per inceptos himenaeos. Praesent auctor purus luctus enim egestas, ac
              scelerisque ante pulvinar. Donec ut rhoncus ex. Suspendisse ac rhoncus nisl, eu tempor
              urna. Curabitur vel bibendum lorem. Morbi convallis convallis diam sit amet lacinia.
              Aliquam in elementum tellus.{" "}
            </p>
            <p className={style.DetailDescription}>
              Curabitur tempor quis eros tempus lacinia. Nam bibendum pellentesque quam a convallis.
              Sed ut vulputate nisi. Integer in felis sed leo vestibulum venenatis. Suspendisse quis
              arcu sem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

type CollapsiblePanelProps = {
  title: string;
  children: React.ReactNode;
};

function CollapsiblePanel({ children, title }: CollapsiblePanelProps) {
  const [isCollapsed, setCollapse] = React.useState(false);
  return (
    <div className={style.Collapsible}>
      <div
        className={style.CollapsibleHeader}
        onClick={() => {
          setCollapse(!isCollapsed);
        }}
      >
        <Collapse
          className={style.CollapseIcon}
          style={{ transform: `rotate(${isCollapsed ? "90deg" : "180deg"})` }}
        />
        <p className={style.CollapsibleHeaderText}>{title}</p>
      </div>
      {!isCollapsed && <div className={style.CollapsibleContent}>{children}</div>}
    </div>
  );
}

type RepoMetrics = {
  stars: number;
  forks: number;
};

type RepoSource = "url" | "zip" | "local";

type RepoRowProps = {
  source: RepoSource;
  repoName: string;
  repoSource: string;
  metrics: RepoMetrics;
};

function RepoRow({ source, repoName, repoSource, metrics }: RepoRowProps) {
  const stars = metrics.stars > 1000 ? `${(metrics.stars / 1000).toFixed(1)}k` : metrics.stars;
  const forks = metrics.forks > 1000 ? `${(metrics.forks / 1000).toFixed(1)}k` : metrics.forks;

  return (
    <button className={style.RepoRow}>
      <div className={style.RepoRowLeft}>
        {source === "url" && <IconEarth />}
        {source === "zip" && <IconFolderZip />}
        {source === "local" && <IconFolder />}
        <div className={style.Grow}>
          <p className={style.RepoRowName}>{repoName}</p>
          <p className={style.RepoRowSource}>{repoSource}</p>
        </div>
      </div>

      <div className={style.RepoRowRight}>
        <div className={style.RepoRowMetrics}>{stars} stars</div>
        <div className={style.RepoRowMetrics}>{forks} forks</div>
      </div>
    </button>
  );
}

type SupportedBy = "chromium" | "firefox" | "safari" | "ios" | "android";
type OpenRowProps = {
  icon: React.ReactNode;
  title: string;
  supportedBy: SupportedBy[];
};

function OpenRow({ icon, title, supportedBy }: OpenRowProps) {
  return (
    <div className={style.OpenRow}>
      <div className={style.OpenRowLeft}>
        {icon}
        <a className={style.OpenRowTitle}>{title}</a>
      </div>

      <div className={style.OpenRowRight}>
        {supportedBy.map((browser) => {
          switch (browser) {
            case "chromium": {
              return (
                <Tooltip title="Supported on Chromium-based browsers">
                  <IconChromium className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "firefox": {
              return (
                <Tooltip title="Supported on Firefox">
                  <IconFirefox className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "safari": {
              return (
                <Tooltip title="Supported on Safari">
                  <IconSafari className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "ios": {
              return (
                <Tooltip title="Supported on iOS">
                  <IconIos className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "android": {
              return (
                <Tooltip title="Supported on Android">
                  <IconAndroid className={style.BrowserIcon} />
                </Tooltip>
              );
            }
          }
        })}
      </div>
    </div>
  );
}

function AdvancedConfigurationPanel() {
  return <div></div>;
}

export default WelcomePage;

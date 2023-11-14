import {
  IconAndroid,
  IconChromium,
  IconCollapse,
  IconEarth,
  IconFirefox,
  IconFolder,
  IconFolderZip,
  IconIos,
  IconSafari,
} from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button, TitleBar } from "@app/primitives";
import shared from "@app/primitives/css/shared-styles.module.scss";
import { useWindowSize } from "@app/utils";
import { Radio, RadioChangeEvent, Tooltip } from "antd";
import clsx from "clsx";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import React from "react";

import style from "./welcome.module.scss";

export const WelcomePage = observer(() => {
  const [width, _] = useWindowSize();
  const isLargeScreen = width > 768;
  const [selectedSource, setSelectedSource] = React.useState<RepoSource | undefined>("local");
  const [currentPanel, setCurrentPanel] = React.useState<"left" | "right">("left");

  return (
    <div className={style.Page}>
      <div className={style.TitleBarContainer}>
        <TitleBar />
      </div>

      <div className={style.Body}>
        <div className={style.SplitPanel}>
          {isLargeScreen && (
            <>
              <LeftPanel
                selectedSource={selectedSource}
                setSelectedSource={(s) => setSelectedSource(s)}
              />
              <div className={style.VerticalRule}></div>
              <RightPanel />
            </>
          )}
          {!isLargeScreen && (
            <>
              {currentPanel === "left" && (
                <LeftPanel
                  selectedSource={selectedSource}
                  setSelectedSource={(s) => {
                    setSelectedSource(s);
                    setCurrentPanel("right");
                  }}
                />
              )}
              {currentPanel === "right" && (
                <RightPanel
                  backArrow
                  onBackArrow={() => {
                    setCurrentPanel("left");
                    setSelectedSource(undefined);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

type LeftPanelProps = {
  selectedSource?: RepoSource;
  setSelectedSource: (source: RepoSource) => void;
};

function LeftPanel({ selectedSource, setSelectedSource }: LeftPanelProps) {
  return (
    <div className={clsx(style.Column, shared.FlexColumn)}>
      <CollapsiblePanel title="Open Repository">
        <>
          <OpenRow
            title="From local file system"
            icon={<IconFolder />}
            supportedBy={["chromium"]}
            isSelected={selectedSource === "local"}
            onSelect={() => setSelectedSource("local")}
          />
          <OpenRow
            title="From .zip"
            icon={<IconFolderZip />}
            supportedBy={["chromium"]}
            isSelected={selectedSource === "zip"}
            onSelect={() => setSelectedSource("zip")}
          />
          <OpenRow
            title="From URL"
            icon={<IconEarth />}
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

type RightPanelProps = {
  backArrow?: boolean;
  onBackArrow?: () => void;
};

function RightPanel({ backArrow = false, onBackArrow = () => {} }: RightPanelProps) {
  return (
    <div className={clsx(style.DetailColumn, shared.FlexColumn, style.Grow)}>
      <div className={style.CollapsibleHeader}>
        {backArrow && <IconCollapse className={style.BackIcon} onClick={onBackArrow} />}
        <h1 className={clsx(style.DetailHeader, shared.Grow)}>Open from local file system</h1>
      </div>
      <p className={style.DetailDescription}>
        Gorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum
        est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin
        lacus, ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat
        lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos
        himenaeos. Praesent auctor purus luctus enim egestas, ac scelerisque ante pulvinar. Donec ut
        rhoncus ex. Suspendisse ac rhoncus nisl, eu tempor urna. Curabitur vel bibendum lorem. Morbi
        convallis convallis diam sit amet lacinia. Aliquam in elementum tellus.{" "}
      </p>
      <p className={style.DetailDescription}>
        Curabitur tempor quis eros tempus lacinia. Nam bibendum pellentesque quam a convallis. Sed
        ut vulputate nisi. Integer in felis sed leo vestibulum venenatis. Suspendisse quis arcu sem.
      </p>

      <AdvancedConfigurationPanel />

      <div className={style.GifPanel} />

      <Button className={style.LoadButton} variant="filled">
        Load repository
      </Button>
    </div>
  );
}

type CollapsiblePanelProps = {
  title: string;
  titleStyle?: string;
  children: React.ReactNode;
};

function CollapsiblePanel({ children, title, titleStyle }: CollapsiblePanelProps) {
  const [isCollapsed, setCollapse] = React.useState(false);
  const variants = {
    open: { opacity: 1, height: "auto", padding: "0.5rem", overflow: "visible" },
    collapsed: { opacity: 0, height: 0, padding: "0", overflow: "hidden" },
  };

  return (
    <div className={clsx(style.Collapsible, shared.FlexColumn)}>
      <div
        className={style.CollapsibleHeader}
        onClick={() => {
          setCollapse(!isCollapsed);
        }}
      >
        <IconCollapse
          className={style.CollapseIcon}
          style={{ transform: `rotate(${isCollapsed ? "90deg" : "180deg"})` }}
        />
        <p className={clsx(style.CollapsibleHeaderText, titleStyle)}>{title}</p>
      </div>

      <motion.div
        initial="open"
        animate={isCollapsed ? "collapsed" : "open"}
        variants={variants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={clsx(style.CollapsibleContent)}
      >
        {children}
      </motion.div>
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
        <div className={clsx(style.Grow, shared.FlexColumn)}>
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
  isSelected?: boolean;
  onSelect?: () => void;
};

function OpenRow({
  icon,
  title,
  supportedBy,
  isSelected = false,
  onSelect = () => {},
}: OpenRowProps) {
  return (
    <div className={clsx(style.OpenRow, shared.FlexRow, isSelected && style.OpenRow__Selected)}>
      <div className={clsx(style.OpenRowLeft, shared.InlineFlexRow)}>
        {icon}
        <a className={style.OpenRowTitle} onClick={() => onSelect()}>
          {title}
        </a>
      </div>

      <div className={shared.RightAlignedGroup}>
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

type AdvancedConfigurationSelection = "fsa" | "html" | "drag";
type AdvancedConfigurationPanelProps = {
  selectedValue?: AdvancedConfigurationSelection;
};

function AdvancedConfigurationPanel({ selectedValue = "fsa" }: AdvancedConfigurationPanelProps) {
  const [value, setValue] = React.useState<AdvancedConfigurationSelection>(selectedValue);

  function onChange(e: RadioChangeEvent) {
    setValue(e.target.value);
  }

  return (
    <CollapsiblePanel title="Advanced configuration" titleStyle={style.AdvancedConfigurationTitle}>
      <Radio.Group
        className={clsx(shared.FlexColumn, shared["Gap-2"])}
        value={value}
        onChange={onChange}
      >
        <Radio value={"fsa"} className={style.Radio}>
          <div>
            <p className={clsx(shared["Text-Base"], shared["Text-Left"])}>File System Access API</p>
            <p className={clsx(shared["Text-Sm"], shared["Text-Left"])}>
              Only available in Chromium-based browsers.
            </p>
            <p className={style.NotSupportedText}>This loader is not supported on this device.</p>
          </div>
        </Radio>
        <Radio value={"html"}>HTML Input Field</Radio>
        <Radio value={"drag"}>Drag & Drop</Radio>
      </Radio.Group>
    </CollapsiblePanel>
  );
}

export default WelcomePage;

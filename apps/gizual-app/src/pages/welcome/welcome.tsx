import { TitleBar } from "@app/primitives";
import { useWindowSize } from "@app/utils";
import { observer } from "mobx-react-lite";
import React from "react";
import { match } from "ts-pattern";

import {
  FileLoaderLocal,
  FileLoaderUrl,
  FileLoaderZipFile,
  useFileLoaders,
} from "@giz/maestro/react";

import { FilesDetailPanel } from "./components/detail-panels/files-detail-panel";
import { UrlDetailPanel } from "./components/detail-panels/url-detail-panel";
import { ZipDetailPanel } from "./components/detail-panels/zip-detail-panel";
import { SelectionPanel } from "./components/selection-panel";
import style from "./welcome.module.scss";
import { prepareSelectedLoaders, RepoSource, WelcomeViewModel } from "./welcome.vm";

export const WelcomePage = observer(() => {
  const vm: WelcomeViewModel = React.useMemo(() => {
    return new WelcomeViewModel();
  }, []);

  const [width, _] = useWindowSize();
  const isLargeScreen = width > 1024;
  const [selectedSource, setSelectedSource] = React.useState<RepoSource | undefined>("local");
  const [currentPanel, setCurrentPanel] = React.useState<"left" | "right">("left");
  const loaders = useFileLoaders();
  const selectedLoader = prepareSelectedLoaders(loaders, selectedSource);

  const onBackArrow = () => {
    setCurrentPanel("left");
    setSelectedSource(undefined);
  };

  return (
    <div className={style.Page}>
      <div className={style.TitleBarContainer}>
        <TitleBar />
      </div>

      <div className={style.Body}>
        <div className={style.SplitPanel}>
          {isLargeScreen && (
            <>
              <SelectionPanel
                selectedSource={selectedSource}
                setSelectedSource={(s) => setSelectedSource(s)}
              />
              <div className={style.VerticalRule}></div>
              {match(selectedSource)
                .with("local", () => (
                  <FilesDetailPanel loaders={selectedLoader as FileLoaderLocal[]} vm={vm} />
                ))
                .with("url", () => <UrlDetailPanel loader={selectedLoader as FileLoaderUrl} />)
                .with("zip", () => <ZipDetailPanel loader={selectedLoader as FileLoaderZipFile} />)
                .otherwise(() => (
                  <div></div>
                ))}
            </>
          )}
          {!isLargeScreen && (
            <>
              {currentPanel === "left" && (
                <SelectionPanel
                  selectedSource={selectedSource}
                  setSelectedSource={(s) => {
                    setSelectedSource(s);
                    setCurrentPanel("right");
                  }}
                />
              )}

              {match(selectedSource)
                .with("local", () => (
                  <FilesDetailPanel
                    loaders={selectedLoader as FileLoaderLocal[]}
                    vm={vm}
                    backArrow
                    onBackArrow={onBackArrow}
                  />
                ))
                .with("url", () => (
                  <UrlDetailPanel
                    loader={selectedLoader as FileLoaderUrl}
                    backArrow
                    onBackArrow={onBackArrow}
                  />
                ))
                .with("zip", () => (
                  <ZipDetailPanel
                    loader={selectedLoader as FileLoaderZipFile}
                    backArrow
                    onBackArrow={onBackArrow}
                  />
                ))
                .otherwise(() => (
                  <div></div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default WelcomePage;

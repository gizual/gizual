import { TitleBar } from "@app/primitives";
import { useWindowSize } from "@app/utils";
import { observer } from "mobx-react-lite";
import React from "react";

import { useFileLoaders } from "@giz/maestro/react";

import { DetailPanel } from "./components/detail-panel";
import { SelectionPanel } from "./components/selection-panel";
import style from "./welcome.module.scss";
import {
  mapSourceToContent,
  prepareSelectedLoaders,
  RepoSource,
  WelcomeViewModel,
} from "./welcome.vm";

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
              {selectedSource && (
                <DetailPanel
                  vm={vm}
                  content={mapSourceToContent(selectedSource)}
                  source={selectedSource}
                  loader={selectedLoader}
                />
              )}
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
              {currentPanel === "right" && selectedSource && (
                <DetailPanel
                  vm={vm}
                  source={selectedSource}
                  backArrow
                  onBackArrow={() => {
                    setCurrentPanel("left");
                    setSelectedSource(undefined);
                  }}
                  content={mapSourceToContent(selectedSource)}
                  loader={selectedLoader}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default WelcomePage;

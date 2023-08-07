import { Container, Languages, parseLanguages } from "@app/charts";
import { AllContributions } from "@app/charts";
import { useWindowSize } from "@app/utils";
import { observer } from "mobx-react-lite";
import React from "react";
import ReactGridLayout from "react-grid-layout";

import { useMainController, useViewModelController } from "../controllers";
import { TitleBar } from "../primitives";
import { Canvas } from "../primitives/canvas";
import { RepoPanel } from "../primitives/repo-panel";
import SearchBar from "../primitives/search-bar/search-bar";
import { Select } from "../primitives/select";
import { SettingsPanel } from "../primitives/settings-panel";

import style from "./main.module.scss";
import { MainPageViewModel } from "./main.vm";

export type MainPageProps = {
  vm?: MainPageViewModel;
};

function MainPage({ vm: externalVm }: MainPageProps) {
  const mainController = useMainController();

  const vm: MainPageViewModel = React.useMemo(() => {
    return externalVm || new MainPageViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.page}>
      <div style={{ position: "relative" }}>
        <TitleBar />
        {mainController.selectedPanel === "explore" && <SearchBar />}
      </div>
      <div className={style.body}>
        {mainController.selectedPanel === "explore" && <ExplorePage vm={vm} />}
        {mainController.selectedPanel === "analyze" && <AnalyzePage vm={vm} />}
      </div>
    </div>
  );
}

const ExplorePage = observer(({ vm }: MainPageProps) => {
  const vmController = useViewModelController();
  if (!vm) return <div />;

  return (
    <>
      {vmController.isRepoPanelVisible && <RepoPanel />}
      <Canvas />
      {vmController.isSettingsPanelVisible && <SettingsPanel />}
    </>
  );
});

const AnalyzePage = observer(({ vm }: MainPageProps) => {
  const mainController = useMainController();
  if (!vm) return <div />;
  const [width, height] = useWindowSize();
  const [canvasWidth, setCanvasWidth] = React.useState(0);

  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    setCanvasWidth(ref.current?.clientWidth ?? width);
  }, [ref, width, height]);

  const layout: ReactGridLayout.Layout[] = [
    { i: "a", x: 0, y: 0, w: 2, h: 2 },
    { i: "b", x: 2, y: 0, w: 2, h: 2 },
  ];

  const [languageChartType, setLanguageChartType] = React.useState<"pie" | "bar">("bar");

  if (!mainController.fileTreeRoot) return <div />;
  const languageData = parseLanguages(mainController.fileTreeRoot);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      <ReactGridLayout layout={layout} width={canvasWidth} cols={6} rowHeight={canvasWidth / 5}>
        <div key={"a"}>
          <Container title={"Contributions"}>
            <AllContributions />
          </Container>
        </div>

        <div key={"b"}>
          <Container
            title={"Language Distribution"}
            titleBar={
              <Select
                data={[
                  { value: "pie", label: "pie" },
                  { value: "bar", label: "bar" },
                ]}
                value={languageChartType}
                onValueChange={(value) => setLanguageChartType(value as any)}
                boxStyle={{ maxWidth: "100px" }}
              />
            }
          >
            <Languages chartType={languageChartType} languages={languageData} />
          </Container>
        </div>
      </ReactGridLayout>
    </div>
  );
});

export default observer(MainPage);

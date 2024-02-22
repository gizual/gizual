import { Container, parseLanguages } from "@app/charts";
import { LanguageDistributionChart } from "@app/charts/languages/language-distribution";
import { useMainController } from "@app/controllers";
import { Canvas, MessageBar, TitleBar } from "@app/primitives";
import { SimpleQueryInput } from "@app/primitives/query-input";
import { useWindowSize } from "@app/utils";
import { observer } from "mobx-react-lite";
import React from "react";
import ReactGridLayout from "react-grid-layout";

import { SettingsPage } from "../settings";

import style from "./main.module.scss";
import { MainPageViewModel } from "./main.vm";

export type MainPageProps = {
  vm?: MainPageViewModel;
};

export const MainPage = observer(({ vm: externalVm }: MainPageProps) => {
  const mainController = useMainController();

  const vm: MainPageViewModel = React.useMemo(() => {
    return externalVm || new MainPageViewModel(mainController);
  }, [externalVm]);

  return (
    <div className={style.Page}>
      <div className={style.TitleBarContainer}>
        <TitleBar />
        <SimpleQueryInput />
        <MessageBar />
      </div>

      <div className={style.Body}>
        {mainController.selectedPanel === "explore" && <ExplorePage vm={vm} />}
        {mainController.selectedPanel === "analyze" && <AnalyzePage vm={vm} />}
        {mainController.selectedPanel === "settings" && <SettingsPage />}
      </div>
    </div>
  );
});

const ExplorePage = observer(({ vm }: MainPageProps) => {
  if (!vm) return <div />;

  return <Canvas />;
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
    //{ i: "b", x: 2, y: 0, w: 2, h: 2 },
  ];

  if (!mainController.fileTreeRoot) return <div />;
  const languageData = parseLanguages(mainController.fileTreeRoot);

  return (
    <div ref={ref} className={style.AnalyzePage}>
      <ReactGridLayout layout={layout} width={canvasWidth} cols={6} rowHeight={canvasWidth / 5}>
        <div key={"a"}>
          <Container title={"Language Distribution"}>
            <LanguageDistributionChart languages={languageData} />
          </Container>
        </div>
      </ReactGridLayout>
    </div>
  );
});

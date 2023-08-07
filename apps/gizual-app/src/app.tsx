import { ConfigProvider, theme as AntdTheme, ThemeConfig } from "antd";
import { SeedToken } from "antd/es/theme/interface";
import { observer } from "mobx-react-lite";

import style from "./app.module.scss";
import { useMainController } from "./controllers";
import MainPage from "./pages/main";
import WelcomePage from "./pages/welcome";
import { Footer } from "./primitives/footer";
import { useStyle, useTheme } from "./utils";

function App() {
  const mainController = useMainController();
  const preferredTheme = useTheme();

  const customStyle: SeedToken = {
    ...AntdTheme.defaultSeed,
    ...AntdTheme.compactAlgorithm,
    colorPrimary: useStyle("--accent-main"),
  };

  const token =
    preferredTheme === "dark"
      ? AntdTheme.darkAlgorithm(customStyle)
      : AntdTheme.defaultAlgorithm(customStyle);

  const config: ThemeConfig = {
    components: {
      Skeleton: {
        gradientFromColor: "var(--background-secondary)",
        gradientToColor: "var(--background-tertiary)",
      },
    },
    token,
  };

  return (
    <ConfigProvider theme={config}>
      <div className={style.App}>
        <div className={style.Main}>
          {mainController.page === "welcome" && <WelcomePage />}
          {mainController.page === "main" && <MainPage />}
        </div>
        <Footer />
      </div>
    </ConfigProvider>
  );
}

export default observer(App);

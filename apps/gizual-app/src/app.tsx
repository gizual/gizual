import { observer } from "mobx-react-lite";

import style from "./app.module.scss";
import { useMainController } from "./controllers";
import MainPage from "./pages/main";
import WelcomePage from "./pages/welcome";
import { useTheme } from "./utils";
import { ConfigProvider, theme as AntdTheme } from "antd";

function App() {
  const mainController = useMainController();
  const preferredTheme = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: [
          preferredTheme === "dark" ? AntdTheme.darkAlgorithm : AntdTheme.defaultAlgorithm,
          AntdTheme.compactAlgorithm,
        ],
        components: {
          Skeleton: {
            gradientFromColor: "var(--background-secondary)",
            gradientToColor: "var(--background-tertiary)",
          },
          Table: {
            colorBgBase: "var(--background-secondary)",
          },
        },
      }}
    >
      <div className={style.App}>
        {mainController.page === "welcome" && <WelcomePage />}
        {mainController.page === "main" && <MainPage />}
      </div>
    </ConfigProvider>
  );
}

export default observer(App);

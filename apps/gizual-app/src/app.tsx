import { WelcomePage } from "@app/pages/welcome";
import { Loading } from "@app/primitives/loading";
import { ConfigProvider, theme as AntdTheme, ThemeConfig } from "antd";
import { App as AntdApp } from "antd";
import { notification as antdNotification } from "antd";
import { SeedToken } from "antd/es/theme/interface";
import { observer } from "mobx-react-lite";
import React from "react";

import { useScreen } from "@giz/maestro/react";

import style from "./app.module.scss";
import { useMainController } from "./controllers";
import { MainPage } from "./pages/main";
import { Footer } from "./primitives/footer";
import { useStyle, useTheme } from "./utils";

function App() {
  const mainController = useMainController();
  const preferredTheme = useTheme();

  const customStyle: SeedToken = {
    ...AntdTheme.defaultSeed,
    ...AntdTheme.compactAlgorithm,
    colorPrimary: useStyle("--accent-main"),
    colorBgBase: useStyle("--background-primary"),
    colorTextBase: useStyle("--foreground-primary"),
    borderRadius: 4,
    fontFamily: "FiraGO",
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
      Select: {
        colorBorder: "var(--border-primary)",
        colorBgContainer: "var(--background-tertiary)",
      },
      Input: {
        colorBorder: "var(--border-primary)",
        colorBgContainer: "var(--background-tertiary)",
      },
      InputNumber: {
        colorBorder: "var(--border-primary)",
        colorBgContainer: "var(--background-tertiary)",
      },
      Table: {
        colorBgContainer: "var(--background-primary)",
      },
    },
    token,
  };
  const [notification, notificationProvider] = antdNotification.useNotification();

  React.useEffect(() => {
    mainController.attachNotificationInstance(notification);
  }, [notification]);

  const screen = useScreen();
  const shouldDisplayLoadingIndicator = mainController.isLoading;

  return (
    <ConfigProvider theme={config}>
      <AntdApp>
        <>
          {notificationProvider}
          <div className={style.App}>
            {shouldDisplayLoadingIndicator && <Loading />}
            <div className={style.Main}>
              {screen === "welcome" && <WelcomePage />}
              {screen === "main" && <MainPage />}
            </div>
            <Footer />
          </div>
        </>
      </AntdApp>
    </ConfigProvider>
  );
}

export default observer(App);

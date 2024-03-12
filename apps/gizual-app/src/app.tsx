import { useTheme } from "@app/hooks/use-theme";
import { WelcomePage } from "@app/pages/welcome";
import { Loading } from "@app/primitives/loading";
import { LocalQueryContext, LocalQueryManager } from "@app/services/local-query";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ContextMenuProvider } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery, useScreen } from "@giz/maestro/react";

import style from "./app.module.scss";
import { useMainController } from "./controllers";
import { MainPage } from "./pages/main";
import { Footer } from "./primitives/footer";

import "@mantine/core/styles.layer.css";
import "mantine-contextmenu/styles.layer.css";
import "mantine-datatable/styles.layer.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

function App() {
  const mainController = useMainController();
  const { query, setQuery, errors } = useQuery();

  const localQueryManager = React.useMemo(() => {
    const lqm = new LocalQueryManager(query, setQuery, errors);
    mainController.setLocalQueryManager(lqm);
    return lqm;
  }, [query, setQuery, errors]);

  const mantineTheme = createTheme({
    colors: {
      accentMain: [
        "#e6f8ff",
        "#d0ecff",
        "#a0d7fc",
        "#6cc1fb",
        "#46adfa",
        "#32a2fa",
        "#259cfb",
        "#1788e0",
        "#0078c9",
        "#0068b2",
      ],
    },
    primaryColor: "accentMain",
    fontFamily: "FiraGO",
    fontFamilyMonospace: "Iosevka Extended",
  });

  const screen = useScreen();
  const theme = useTheme();
  const shouldDisplayLoadingIndicator = mainController.isLoading;

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={theme}>
      <Notifications position="top-right" />
      <ContextMenuProvider>
        <LocalQueryContext.Provider value={localQueryManager}>
          <div className={style.App}>
            {shouldDisplayLoadingIndicator && (
              <Loading progressText={mainController.progressText} />
            )}
            <div className={style.Main}>
              {screen === "welcome" && <WelcomePage />}
              {screen === "main" && <MainPage />}
            </div>
            <Footer />
          </div>
        </LocalQueryContext.Provider>
      </ContextMenuProvider>
    </MantineProvider>
  );
}

export default observer(App);

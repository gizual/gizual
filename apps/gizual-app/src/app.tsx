import { useTheme } from "@app/hooks/use-theme";
import { ErrorPage } from "@app/pages/error/error";
import { WelcomePage } from "@app/pages/welcome-v2";
import { Loading } from "@app/primitives/loading";
import { LocalQueryContext, LocalQueryManager } from "@app/services/local-query";
import { createTheme, MantineProvider, Menu, Popover } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ContextMenuProvider } from "mantine-contextmenu";
import { observer } from "mobx-react-lite";
import React from "react";

import { useMaestro, useScreen } from "@giz/maestro/react";

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
  const maestro = useMaestro();

  // TODO: maybe we can move this into mainController?
  const localQueryManager = React.useMemo(() => {
    const lqm = new LocalQueryManager(maestro);
    mainController.setLocalQueryManager(lqm);
    return lqm;
  }, [maestro]);

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
    fontFamily: "Figtree",
    fontFamilyMonospace: "Iosevka Extended",
    components: {
      Popover: Popover.extend({
        styles: {
          dropdown: {
            backgroundColor: "var(--background-secondary)",
            borderColor: "var(--border-primary)",
          },
          arrow: { borderColor: "var(--border-primary)" },
        },
      }),
      Menu: Menu.extend({
        styles: {
          dropdown: {
            backgroundColor: "var(--background-secondary)",
            borderColor: "var(--border-primary)",
          },
        },
      }),
    },
  });

  const screen = useScreen();
  const theme = useTheme();
  const shouldDisplayLoadingIndicator = mainController.isLoading;
  const isSecureContext = window.isSecureContext;

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={theme}>
      <Notifications position="top-right" />
      <ContextMenuProvider>
        <LocalQueryContext.Provider value={localQueryManager}>
          <div className={style.App}>
            {!isSecureContext && <ErrorPage />}

            {isSecureContext && (
              <>
                {shouldDisplayLoadingIndicator && (
                  <Loading progressText={mainController.progressText} />
                )}
                <div className={style.Main}>
                  {screen === "welcome" && <WelcomePage />}
                  {screen === "main" && <MainPage />}
                </div>
                <Footer />
              </>
            )}
          </div>
        </LocalQueryContext.Provider>
      </ContextMenuProvider>
    </MantineProvider>
  );
}

export default observer(App);

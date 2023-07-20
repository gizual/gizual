import { ConfigProvider } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app";
import { MainContext, MainController } from "./controllers";

import "./index.scss";

const mainController = new MainController();

(window as any).mainController = mainController;

ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(
  <MainContext.Provider value={mainController}>
    <ConfigProvider
      theme={{
        components: {
          Skeleton: {
            color: "var(--background-tertiary)",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </MainContext.Provider>
);

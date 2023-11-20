import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { Maestro } from "@giz/maestro";
import { MaestroProvider } from "@giz/maestro/react";

import App from "./app";
import { MainContext, MainController } from "./controllers";

import "./index.scss";
import "./icons/fonts.css";
import "./icons/icons.css";
import "./icons/colors.css";

const maestro = new Maestro();

(window as any).maestro = maestro;

await maestro.setup();

const mainController = new MainController(maestro);

(window as any).mainController = mainController;

ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(
  <MaestroProvider maestro={maestro}>
    <MainContext.Provider value={mainController}>
      <StrictMode>
        <App />
      </StrictMode>
    </MainContext.Provider>
  </MaestroProvider>,
);

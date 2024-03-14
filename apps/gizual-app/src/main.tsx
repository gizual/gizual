import "@giz/logging/browser";

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

setTimeout(() => {
  const url = new URL(window.location.href);
  const repoUrl = url.searchParams.get("source");
  if (repoUrl) {
    maestro.openRepoFromURL(repoUrl);
  }
}, 10);

declare global {
  interface Window {
    plausible?: (event: string, props?: Record<string, any>) => void;
  }
}

if (import.meta.env.PROD) {
  setTimeout(() => {
    if (!window.plausible) {
      return;
    }
    const url = new URL(window.location.href);
    // remove query params and hash
    url.search = "";
    url.hash = "";

    if (!/app\.gizual\.com/.test(location.hostname)) {
      return;
    }

    window.plausible("pageview", {
      u: url.toString(),
    });

    maestro.on("open:remote-clone", ({ repoName, service, url }) => {
      window.plausible!("remote-clone", { props: { repoName, service, url } });
    });

    maestro.on("open:file-input", ({ numFiles }) => {
      window.plausible!("file-input", { props: { numFiles } });
    });

    maestro.on("open:drag-drop", ({ name }) => {
      window.plausible!("drag-drop", { props: { name } });
    });

    maestro.on("open:zip", ({ size, name }) => {
      window.plausible!("zip", { props: { size, name } });
    });

    maestro.on("open:fsa", ({ name }) => {
      window.plausible!("fsa", { props: { name } });
    });
  }, 100);
}

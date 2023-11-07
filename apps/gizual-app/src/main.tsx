import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import ReactDOM from "react-dom/client";

import { AppRouter, Maestro } from "@giz/maestro";

import App from "./app";
import { MainContext, MainController } from "./controllers";

import "./index.scss";
import "./icons/fonts.css";
import "./icons/icons.css";
import "./icons/colors.css";

const maestro = new Maestro();

await maestro.setup();

const mainController = new MainController(maestro);

(window as any).mainController = mainController;

export const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
  links: [maestro.link],
});
const queryClient = new QueryClient();

ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <MainContext.Provider value={mainController}>
        <App />
      </MainContext.Provider>
      ,
    </QueryClientProvider>
  </trpc.Provider>,
);

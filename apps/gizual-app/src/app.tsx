import { useState } from "react";

import style from "./app.module.scss";
import MainPage from "./pages/main";
import WelcomePage from "./pages/welcome";
import { useMainController } from "./controllers";
import { observer } from "mobx-react-lite";

function App() {
  const mainController = useMainController();

  return (
    <div className={style.App}>
      {mainController.page === "welcome" && (
        <WelcomePage
          cb={() => {
            mainController.setPage("main");
          }}
        />
      )}
      {mainController.page === "main" && <MainPage />}
    </div>
  );
}

export default observer(App);

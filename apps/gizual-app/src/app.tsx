import { observer } from "mobx-react-lite";

import style from "./app.module.scss";
import { useMainController } from "./controllers";
import MainPage from "./pages/main";
import WelcomePage from "./pages/welcome";

function App() {
  const mainController = useMainController();

  return (
    <div className={style.App}>
      {mainController.page === "welcome" && <WelcomePage />}
      {mainController.page === "main" && <MainPage />}
    </div>
  );
}

export default observer(App);

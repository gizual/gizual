import { useMainController } from "@app/controllers";
import { Button } from "@app/primitives";
import { isSupportedBrowser } from "@app/utils";
import { Spin } from "antd";
import { observer } from "mobx-react-lite";

import style from "./welcome.module.scss";

export const WelcomePage = observer(() => {
  const mainController = useMainController();
  return (
    <div className={style.App}>
      <div className={style.Container}>
        <img className={style.WelcomeImage} src="./giz.png" alt="Gizual Logo" />
        <h1 className={style.Header}>Gizual</h1>
        <p className={style.WelcomeParagraph}>Welcome to Gizual!</p>
        <div className={style.Card}>
          {isSupportedBrowser() ? (
            <>
              {mainController.isLoading ? (
                <Spin size={"large"} style={{ margin: "auto", marginBottom: "1rem" }}></Spin>
              ) : (
                <>
                  <Button
                    variant="filled"
                    onClick={() => mainController.openRepository()}
                    className={style.Button}
                  >
                    Load Repository
                  </Button>
                </>
              )}
            </>
          ) : (
            <UnsupportedBrowser />
          )}
        </div>
      </div>
    </div>
  );
});

function UnsupportedBrowser() {
  return (
    <div className={style.EmphasizedContainer}>
      <h2 className={style.EmphasizedHeader}>🚫</h2>
      <p>{"It looks like you're using an unsupported browser."}</p>
      <p>
        {"Gizual requires an implementation of "}
        <code>showDirectoryPicker</code>
        {"."}
      </p>
      <p>
        {"This feature is currently only "}
        <a href="https://caniuse.com/?search=showDirectoryPicker" target="_blank" rel="noreferrer">
          {"supported in Chromium based browsers"}
        </a>
        {"."}
      </p>
    </div>
  );
}

export default WelcomePage;

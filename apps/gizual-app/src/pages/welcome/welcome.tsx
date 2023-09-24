import { useMainController } from "@app/controllers";
import { Button } from "@app/primitives";
import { isSupportedBrowser } from "@app/utils";
import { Spin } from "antd";
import { observer } from "mobx-react-lite";

import baseStyle from "../../app.module.scss";

import style from "./welcome.module.scss";

export const WelcomePage = observer(() => {
  const mainController = useMainController();
  return (
    <div className={baseStyle.App}>
      <div className={baseStyle.container}>
        <img className={baseStyle.img} src="./giz.png" alt="Gizual Logo" />
        <h1 className={baseStyle.h1}>Gizual</h1>
        <p className={style.p}>Welcome to Gizual!</p>
        <div className={style.card}>
          {isSupportedBrowser() ? (
            <>
              {mainController.isLoading ? (
                <Spin size={"large"} style={{ margin: "auto", marginBottom: "1rem" }}></Spin>
              ) : (
                <>
                  <Button
                    variant="filled"
                    onClick={() => mainController.openRepository()}
                    className={style.button}
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
    <div className={style.emphasized}>
      <h2 className={style.emphasizedHeader}>🚫</h2>
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

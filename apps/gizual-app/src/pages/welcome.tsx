import { Spin } from "antd";
import { observer } from "mobx-react-lite";

import baseStyle from "../app.module.scss";
import { useMainController } from "../controllers";
import { Button } from "../primitives";

const WelcomePage = observer(() => {
  const mainController = useMainController();
  return (
    <div className={baseStyle.App}>
      <div className={baseStyle.container}>
        <img className={baseStyle.img} src="./giz.png" alt="Gizual Logo" />
        <h1 className={baseStyle.h1}>Gizual</h1>
        <p className={baseStyle.p}>Welcome to Gizual!</p>
        <div className={baseStyle.card}>
          {mainController.isLoading ? (
            <Spin tip={"Loading Repository"} size={"large"} style={{ margin: "auto" }}></Spin>
          ) : (
            <Button
              variant="filled"
              onClick={() => mainController.openRepository()}
              className={baseStyle.button}
            >
              Load Repository
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default WelcomePage;

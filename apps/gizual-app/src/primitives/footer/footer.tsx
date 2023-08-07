import { Spin } from "antd";
import { observer } from "mobx-react-lite";

import { useMainController } from "../../controllers";

import style from "./footer.module.scss";

export const Footer = observer(() => {
  const mainController = useMainController();

  return (
    <div className={style.footer}>
      <div className={style.left}>
        <p>Gizual v0.1</p>
      </div>
      <div className={style.right}>
        <Spin spinning={mainController.isBusy} />
        {mainController.numActiveWorkers === 0 && (
          <p>
            <em style={{ fontWeight: "bold" }}>{mainController.numActiveWorkers}</em> busy canvas
            workers
          </p>
        )}
      </div>
    </div>
  );
});

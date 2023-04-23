import { observer } from "mobx-react-lite";

import { File } from "../file/";

import style from "./canvas.module.scss";

function Canvas() {
  return (
    <div className={style.Canvas}>
      <File />
      <File />
      <File />
    </div>
  );
}

export default observer(Canvas);

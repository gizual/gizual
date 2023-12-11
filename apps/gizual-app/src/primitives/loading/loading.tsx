import { ScaleLoader } from "react-spinners";

import style from "./loading.module.scss";

export function Loading() {
  return (
    <div className={style.GlobalLoadingIndicator}>
      <div className={style["GlobalLoadingIndicator--inner"]}>
        <p>Loading</p>
        <div className={style["GlobalLoadingIndicator--innerLoaderContainer"]}>
          <ScaleLoader color="#007acc" />
        </div>
      </div>
    </div>
  );
}

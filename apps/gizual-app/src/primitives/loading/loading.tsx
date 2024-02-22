import { ScaleLoader } from "react-spinners";

import style from "./loading.module.scss";

type LoadingProps = {
  progressText?: string;
};

export function Loading({ progressText }: LoadingProps) {
  return (
    <div className={style.GlobalLoadingIndicator}>
      <div className={style["GlobalLoadingIndicator--inner"]}>
        <p>Loading</p>
        <div className={style["GlobalLoadingIndicator--innerLoaderContainer"]}>
          <ScaleLoader color="#007acc" />
        </div>
        <span>{progressText}</span>
      </div>
    </div>
  );
}

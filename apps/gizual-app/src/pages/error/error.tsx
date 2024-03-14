import { AnimatedLogo } from "@giz/ui";

import style from "./error.module.scss";

function ErrorPage() {
  return (
    <div className={style.Body}>
      <div className={style.Card}>
        <div className={style.LogoWrapper}>
          <AnimatedLogo animationState="idle" />
        </div>
        <h1 className={style.Heading}>Error ⚠️</h1>
        <p>
          Due to browser security policies, Gizual requires a{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts">
            Secure Context
          </a>{" "}
          to run.
        </p>
        <p>
          Check out our <a href="https://gizual.com/compatibility">Compatibility Page</a> for
          details.
        </p>
      </div>
    </div>
  );
}

export { ErrorPage };

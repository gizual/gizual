import { IconGithub } from "@app/assets";

import style from "./header.module.scss";

function Header() {
  return (
    <header className={style.Wrapper}>
      <div className={style.Header}>
        <div className={style.Content}>
          {/* Site branding */}
          <div className={style.Branding}>
            <a href="https://gizual.com">
              <img src={"./giz-icon.svg"} className={style.Branding__Logo} alt="Gizual Logo" />
            </a>
            <p className={style.Branding__Text}>
              gizual
              <span className={style.Branding__Version}>alpha</span>
            </p>
          </div>

          {/* Site navigation */}
          <nav>
            <ul>
              <li>
                <a
                  href="/docs"
                  className="text-foreground-tertiary hover:text-foreground-secondary flex items-center py-3 text-base font-medium transition duration-150 ease-in-out"
                >
                  Docs
                </a>
              </li>
              <li title="Github link coming soon! :)">
                {/*<a href="https://github.com/gizual/gizual" aria-label="Github Repository - Gizual">*/}
                <IconGithub className={style.GithubIcon}></IconGithub>
                {/*</a>*/}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export { Header };

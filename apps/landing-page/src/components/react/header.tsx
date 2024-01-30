import React, { useState, useEffect } from "react";
import GithubMark from "./github-mark-white.svg";

function Header({ logo }: { logo: string }) {
  const [top, setTop] = useState(true);

  // detect whether user has scrolled the page down by 10px
  useEffect(() => {
    const scrollHandler = () => {
      window.pageYOffset > 10 ? setTop(false) : setTop(true);
    };
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, [top]);

  return (
    <header className="fixed z-30 w-full bg-black opacity-90 shadow-lg backdrop-blur-lg transition duration-300 ease-in-out md:bg-opacity-90">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex h-12 items-center justify-between md:h-16">
          {/* Site branding */}
          <div className="mr-4 flex flex-shrink-0 flex-row items-center gap-4">
            <a href="/">
              <img src={logo} className="h-6 w-auto sm:h-8" alt="Logo" />
            </a>
            <p className="text-xl font-bold text-slate-50 sm:text-2xl">Gizual</p>
          </div>

          {/* Site navigation */}
          <nav className="flex flex-grow">
            <ul className="flex flex-grow flex-wrap items-center justify-end">
              <li>
                {/*<a href="https://github.com/gizual/gizual" aria-label="Github Repository - Gizual">*/}
                <img src={GithubMark.src} className="h-4 sm:h-6"></img>
                {/*</a>*/}
              </li>
              <li>
                <a
                  href="/documentation"
                  className="flex items-center px-5 py-3 text-base font-medium text-foreground-tertiary transition duration-150 ease-in-out hover:text-foreground-secondary"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export { Header };

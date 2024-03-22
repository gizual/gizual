import { IconWarning } from "@app/assets";
import { useMediaQuery } from "@app/hooks/use-media-query";
import { observer } from "mobx-react-lite";
import React from "react";

import { useFileLoaders } from "@giz/maestro/react";

import { Local, Remote } from "./cards";
import { FeaturedRepos } from "./featured-repos";
import { Header } from "./header";
import style from "./welcome.module.scss";

const WelcomePage = observer(() => {
  const isMobile = useMediaQuery({ max: 830 });
  const [expandedSection, setExpandedSection] = React.useState<"local" | "remote">("remote");
  const [dragging, setDragging] = React.useState(false);
  const loaders = useFileLoaders();
  const supportsLocalLoaders = loaders.local.length > 0;
  const hasFsa = loaders.local.some((l) => l.id === "fsa");

  const toggleExpandedSection = (expanded: boolean, section: "local" | "remote") => {
    if (expanded) setExpandedSection(section);
  };

  return (
    <div
      className={style.WelcomePage}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        const { relatedTarget, currentTarget } = e;
        if (!relatedTarget || !currentTarget.contains(relatedTarget as Node)) {
          setDragging(false);
        }
      }}
    >
      <Header />
      <div className={style.Body}>
        {!hasFsa && (
          <div className={style.BrowserWarning}>
            <IconWarning />
            <span>
              Gizual works best on Chromium-based browsers with the{" "}
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_API">
                File System Access API
              </a>
              . If you are on Firefox or Safari, load local files via drag & drop for best
              performance.
            </span>
          </div>
        )}
        <div className={style.Section} style={{ marginTop: "0.75rem" }}>
          <h2 className={style.Section__Title}>Select your Repository</h2>
          <div className={style.SourceSelection}>
            <Local
              isExpanded={expandedSection === "local"}
              isDragging={dragging}
              setExpanded={(e) => toggleExpandedSection(e, "local")}
              collapsible={isMobile}
              supported={supportsLocalLoaders}
            />
            <span className={style.SourceSelection__InBetweenText}>OR</span>
            <Remote
              isExpanded={expandedSection === "remote"}
              setExpanded={(e) => toggleExpandedSection(e, "remote")}
              collapsible={isMobile}
            />
          </div>
        </div>
        <hr className={style.Divider} />
        <div className={style.Section}>
          <h2 className={style.Section__Title}>Featured Repositories</h2>
          <FeaturedRepos />
          <span className={style.ContactUs}>
            Think your repository should be on this list? <a>Contact us!</a>
          </span>
        </div>
        <div className={style.Footer}>
          <hr />
          <span className={style.ContactUs}>Created with ♥ in Graz, Austria.</span>
        </div>
      </div>
    </div>
  );
});

export { WelcomePage };

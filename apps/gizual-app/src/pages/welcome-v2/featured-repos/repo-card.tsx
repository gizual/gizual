import { IconStarFilled } from "@app/assets";
import { Button } from "@app/primitives/button";
import clsx from "clsx";

import { useFileLoaders } from "@giz/maestro/react";

import style from "./featured-repos.module.scss";
import { RepoModal } from "./repo-modal";

type RepoCardProps = {
  repoName?: string;
  repoSource?: string;
  imageSource?: string;
  metrics?: {
    /** String that includes the unit, e.g. `1.2MB`. */
    size?: string;

    /** Number, will be transformed to `k` notation if applicable. */
    stars?: number;

    /** 7-digits, without the leading `#`. */
    commitHash?: string;
  };
};

function RepoCard({
  repoName = "test/demo",
  repoSource = "https://github.com/test/demo",
  imageSource = "",
  metrics = { size: "", commitHash: "", stars: 0 },
}: RepoCardProps) {
  const { url: urlLoader } = useFileLoaders();
  const { size = "", stars = 0, commitHash = "" } = metrics;

  const displayStars = stars > 1000 ? `${(stars / 1000).toFixed(1)}k` : stars;
  const displayCommitHash = commitHash ? `#${commitHash}` : "";

  const onClick = () => {
    urlLoader.load(repoSource);
  };

  return (
    <Button className={style.RepoCard} variant="unstyled" onClick={onClick}>
      <div className={style.RepoCard__Row}>
        <div className={style.RepoCard__TitleWithImage}>
          {imageSource && (
            <img className={style.RepoCard__Image} src={imageSource} crossOrigin="anonymous" />
          )}
          <h3 className={style.RepoCard__Title}>{repoName}</h3>
        </div>
        <div className={style.RepoCard__Meta}>
          {commitHash && (
            <span
              className={clsx(style.RepoCard__MetaItem, style["RepoCard__MetaItem--Secondary"])}
            >
              {displayCommitHash}
            </span>
          )}
          {size && (
            <span className={clsx(style.RepoCard__MetaItem, style["RepoCard__MetaItem--Primary"])}>
              {size}
            </span>
          )}
        </div>
      </div>
      <div className={style.RepoCard__Row}>
        <div onClick={(e) => e.stopPropagation()}>
          <RepoModal repoName={repoName} repoSource={repoSource} onOpenCb={onClick} />
        </div>
        <div className={style.RepoCard__Meta}>
          {stars !== 0 && (
            <span className={clsx(style.RepoCard__MetaItem, style["RepoCard__MetaItem--Primary"])}>
              <IconStarFilled />
              {displayStars}
            </span>
          )}
        </div>
      </div>
    </Button>
  );
}

export { RepoCard };

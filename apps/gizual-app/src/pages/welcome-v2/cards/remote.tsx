import { IconEarth, IconInfo, IconWarning } from "@app/assets";
import { Button } from "@app/primitives/button";
import { Input } from "@app/primitives/input";
import { Collapse } from "@mantine/core";
import React from "react";

import { useFileLoaders } from "@giz/maestro/react";

import style from "./card.module.scss";

type RemoteProps = {
  isExpanded?: boolean;
  setExpanded?: (expanded: boolean) => void;
  collapsible?: boolean;
  supported?: boolean;
};

function Remote({ isExpanded, setExpanded, collapsible = false, supported = true }: RemoteProps) {
  if (isExpanded === undefined || setExpanded === undefined)
    [isExpanded, setExpanded] = React.useState(true);
  const loaders = useFileLoaders();
  const [url, setUrl] = React.useState("");
  const [isValidUrl, setValidUrl] = React.useState(true);

  const toggleExpanded = () => {
    if (collapsible && setExpanded) {
      setExpanded(!isExpanded);
    }
  };

  const onUrlChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    const urlRegex = /(https?:\/\/(?:www\.)?(?:github|gitlab|bitbucket)\.(?:com|org)\/\S*)/;
    setValidUrl(urlRegex.test(e.target.value));
  };

  const onClick = async () => {
    const loader = loaders.url;
    loader.load(url);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      onClick();
    }
  };

  return (
    <section className={style.Card}>
      <Button
        className={style.Header}
        aria-expanded={isExpanded}
        aria-controls="card-body"
        onClick={toggleExpanded}
        disabled={!collapsible}
        variant="unstyled"
      >
        <IconEarth className={style.Header__Icon} />
        <h2 className={style.Header__Title}>Remote</h2>
      </Button>
      <Collapse id="card-body" in={!collapsible || isExpanded}>
        <div className={style.Body}>
          {supported && (
            <div className={style.ActionArea}>
              <Input
                placeholder="Enter URL to a .git repository"
                size="xs"
                value={url}
                onChange={onUrlChanged}
                error={!isValidUrl}
                onKeyDown={onKeyDown}
              />
              <Button className={style.ActionArea__Button} onClick={onClick}>
                <IconEarth />
                Load from remote
              </Button>
            </div>
          )}
          {!supported && (
            <div className={style.UnsupportedDevice}>
              <IconWarning />
              <span>
                This build was not compiled with the Gizual API. Use the{" "}
                <a href="https://gizual.com">official build</a> to load remote repositories.
              </span>
            </div>
          )}
          <div className={style.DescriptionArea}>
            <div className={style.Description}>
              <IconInfo className={style.Description__Icon} />
              <div className={style.Description__Content}>
                <div className={style.Description__Title}>Info</div>
                <div className={style.Description__Text}>
                  <span>
                    Only public repositories from known <a href="">Providers</a> can be cloned
                    directly. Clones are proxied through Gizual&apos;s servers - standard rate
                    limits may apply.
                  </span>
                  <span>
                    Check the <a href="">Documentation</a> to learn more.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Collapse>
    </section>
  );
}

export { Remote };

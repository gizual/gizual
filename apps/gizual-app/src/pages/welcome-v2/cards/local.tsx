import { IconFolder, IconInfo, IconNoCloud, IconWarning } from "@app/assets";
import { Button } from "@app/primitives/button";
import { Collapse } from "@mantine/core";
import clsx from "clsx";
import React from "react";

import { FileLoaderFSA, FileLoaderInputField, useFileLoaders } from "@giz/maestro/react";

import style from "./card.module.scss";

type LocalProps = {
  isExpanded?: boolean;
  setExpanded?: (expanded: boolean) => void;
  collapsible?: boolean;
  supported?: boolean;
  isDragging?: boolean;
};

function Local({
  isExpanded,
  setExpanded,
  collapsible = false,
  supported = false,
  isDragging = false,
}: LocalProps) {
  if (isExpanded === undefined || setExpanded === undefined)
    [isExpanded, setExpanded] = React.useState(true);
  const loaders = useFileLoaders();

  const toggleExpanded = () => {
    if (collapsible && setExpanded) {
      setExpanded(!isExpanded);
    }
  };

  const onClick = async () => {
    /* FSA */
    let preferredLoader = loaders.local.find((l) => l.id === "fsa");
    if (preferredLoader) {
      window.showDirectoryPicker().then((handle) => {
        (preferredLoader as FileLoaderFSA).load(handle);
      });
      return;
    }

    preferredLoader = loaders.local.find((l) => l.id === "input-field");
    if (preferredLoader) {
      showFilePicker("directory").then((files) => {
        (preferredLoader as FileLoaderInputField).load(files);
      });
      return;
    }
  };

  return (
    <section className={clsx(style.Card)}>
      {isDragging && <div className={style.DropZoneOverlay}>👋 Drag your files here!</div>}
      <Button
        className={style.Header}
        aria-expanded={!collapsible || isExpanded}
        aria-controls="card-body"
        onClick={toggleExpanded}
        disabled={!collapsible}
        variant="unstyled"
      >
        <IconFolder className={style.Header__Icon} />
        <h2 className={style.Header__Title}>Local</h2>
      </Button>
      <Collapse id="card-body" in={!collapsible || isExpanded}>
        <div className={style.Body}>
          {supported && (
            <div className={style.ActionArea} style={{ paddingTop: "0.625rem" }}>
              <span>
                <em>Drag & drop</em> a folder into this box, or
              </span>
              <Button className={style.ActionArea__Button} onClick={() => onClick()}>
                <IconFolder />
                Choose local folder
              </Button>
            </div>
          )}
          {!supported && (
            <div className={style.UnsupportedDevice}>
              <IconWarning />
              Your device or browser does not support loading local repositories.
            </div>
          )}
          <div className={style.DescriptionArea}>
            <div className={style.Description}>
              <IconInfo className={style.Description__Icon} />
              <div className={style.Description__Content}>
                <div className={style.Description__Title}>Info</div>
                <div className={style.Description__Text}>
                  <span>
                    Choose the root directory of your repository, or the <code>.git</code> folder.
                  </span>
                  <span>
                    Check the <a href="">Documentation</a> to learn more.
                  </span>
                </div>
              </div>
            </div>
            <hr className={style.Divider} />
            <div className={style.Description}>
              <IconNoCloud className={style.Description__Icon} />
              <div className={style.Description__Content}>
                <div className={style.Description__Title}>Worried about privacy?</div>
                <div className={style.Description__Text}>
                  <span>No need - all data is processed locally and never leaves your device.</span>
                  <span>
                    Read our <a href="">Privacy Notice</a> to learn more.
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

function showFilePicker(type: "directory" | "zip" = "directory") {
  const input = document.createElement("input");
  input.style.display = "none";
  input.style.visibility = "hidden";
  input.type = "file";
  if (type === "directory") {
    //input.multiple = true;
    input.webkitdirectory = true;
  } else {
    input.accept = ".zip";
  }

  document.body.append(input);

  const remove = () => {
    try {
      input.remove();
    } catch {
      // noop
    }
  };

  const promise = new Promise<FileList>((resolve, reject) => {
    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        resolve(input.files);
      } else {
        reject("No files selected");
      }

      remove();
    };

    input.oncancel = () => {
      reject("User cancelled");
      remove();
    };
  });
  input.click();
  return promise;
}

export { Local };

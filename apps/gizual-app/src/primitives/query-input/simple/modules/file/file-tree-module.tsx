import { IconFile } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button, DialogProvider, FileTree } from "@app/primitives";

import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

export function FileTreeModule() {
  const mainController = useMainController();
  return (
    <FileBaseQueryModule
      icon={<IconFile />}
      title={"Files:"}
      hasSwapButton
      disableItems={["filePicker"]}
      highlightItems={["filePicker"]}
    >
      <div className={style.SpacedChildren}>
        <DialogProvider
          trigger={
            <Button variant="filled" size="small">
              {mainController.repoController.selectedFiles.size > 0 ? (
                <>{mainController.repoController.selectedFiles.size} files selected</>
              ) : (
                <>Open file picker</>
              )}
            </Button>
          }
          title="File picker"
        >
          <div className={style.FileTreeWrapper}>
            <FileTree mode="full" />
          </div>
        </DialogProvider>
      </div>
    </FileBaseQueryModule>
  );
}

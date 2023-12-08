import { IconFile } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button, DialogProvider, FileTree } from "@app/primitives";

import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

export function FileTreeModule() {
  const mainController = useMainController();
  return (
    <BaseQueryModule icon={<IconFile />} title={"Files:"} hasRemoveIcon>
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
            <FileTree />
          </div>
        </DialogProvider>
      </div>
    </BaseQueryModule>
  );
}

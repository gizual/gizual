import { IconFile } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button, DialogProvider, FileTree } from "@app/primitives";
import { useLocalQueryCtx } from "@app/utils";
import React from "react";

import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

function getTreeEntries(query: SearchQueryType) {
  if (query.files && "path" in query.files && Array.isArray(query.files.path))
    return query.files.path;
  return [];
}

export function FileTreeModule() {
  const mainController = useMainController();
  const { localQuery, publishLocalQuery, updateLocalQuery } = useLocalQueryCtx();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const values = getTreeEntries(localQuery);

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
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          withFooter
          defaultFooterOpts={{
            hasOk: true,
            okLabel: "Save",
            onOk: () => {
              publishLocalQuery();
              setIsDialogOpen(false);
            },
            hasCancel: true,
            cancelLabel: "Cancel",
            onCancel: () => {
              setIsDialogOpen(false);
            },
          }}
          title="File picker"
        >
          <div className={style.FileTreeWrapper}>
            <FileTree
              mode="full"
              checked={values}
              onChange={(files) => {
                updateLocalQuery({ files: { path: files } });
              }}
            />
          </div>
        </DialogProvider>
      </div>
    </FileBaseQueryModule>
  );
}

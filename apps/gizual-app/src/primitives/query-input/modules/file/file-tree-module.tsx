import { IconFile } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Button, DialogProvider, FileTree } from "@app/primitives";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";
import React from "react";

import type { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { ViewMode } from "../../shared";
import style from "../modules.module.scss";

import { FileBaseQueryModule } from "./file-base-module";

const QUERY_ID = "files.path";

function getTreeEntries(query: SearchQueryType) {
  if (query.files && "path" in query.files && Array.isArray(query.files.path))
    return query.files.path;
  return [];
}

function checkErrors(errors: QueryError[] | undefined) {
  return errors?.some((e) => e.selector === QUERY_ID);
}

type FileTreeModuleProps = {
  viewMode?: ViewMode;
};

const FileTreeModule = observer(({ viewMode }: FileTreeModuleProps) => {
  const { errors } = useLocalQuery();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  if (viewMode === "modal") {
    return (
      <div className={style.Module__Column}>
        <FileTreeModal isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>
    );
  }

  return (
    <FileBaseQueryModule
      containsErrors={checkErrors(errors)}
      icon={<IconFile />}
      title={"Files"}
      hasSwapButton
      disableItems={["filePicker"]}
      highlightItems={["filePicker"]}
    >
      <div className={style.SpacedChildren}>
        <FileTreeModal isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>
    </FileBaseQueryModule>
  );
});

type FileTreeModalProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
};

const FileTreeModal = observer(({ isDialogOpen, setIsDialogOpen }: FileTreeModalProps) => {
  const mainController = useMainController();
  const { localQuery, publishLocalQuery, updateLocalQuery } = useLocalQuery();
  const values = getTreeEntries(localQuery);

  return (
    <DialogProvider
      trigger={
        <Button variant="filled" size={"regular"}>
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
  );
});

export { FileTreeModule };

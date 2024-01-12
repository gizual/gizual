import { useTheme } from "@app/utils/hooks";
import { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { Loading } from "../loading";

import style from "./editor.module.scss";

type EditorProps = {
  fileContent?: string;
};

function Editor({ fileContent }: EditorProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [editorContent, setEditorContent] = React.useState(fileContent);

  const monacoInstance = useMonaco();

  const theme = useTheme();

  function parseInput(e: string | undefined) {
    if (e === undefined) return;
    setEditorContent(e);
  }

  if (!monacoInstance) return <></>;

  return (
    <div className={style.EditorContainer}>
      {isLoading && <Loading />}
      <MonacoEditor
        className={clsx(style.Editor, isLoading && style.EditorLoading)}
        defaultLanguage="json"
        value={editorContent}
        onMount={(_e, _m) => {
          setIsLoading(false);
        }}
        onChange={(e) => parseInput(e)}
        theme={theme === "light" ? "light" : "vs-dark"}
        height="85vw"
        width="80vw"
        options={{ readOnly: true, rulers: [200] }}
      />
    </div>
  );
}

export default observer(Editor);

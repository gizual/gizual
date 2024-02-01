import { useTheme } from "@app/utils/hooks";
import { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { Loading } from "../loading";

import style from "./editor.module.scss";

type EditorProps = {
  fileContent?: string;
  isLoading?: boolean;
};

function Editor({ fileContent, isLoading }: EditorProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  const monacoInstance = useMonaco();

  const theme = useTheme();

  if (!monacoInstance) return <></>;

  return (
    <div className={style.EditorContainer}>
      {(isLoading || !isMounted) && <Loading />}
      <MonacoEditor
        className={clsx(style.Editor, isLoading && style.EditorLoading)}
        defaultLanguage="json"
        value={fileContent}
        onMount={(_e, _m) => {
          setIsMounted(true);
        }}
        theme={theme === "light" ? "light" : "vs-dark"}
        height="100%"
        width="100%"
        options={{ readOnly: true, rulers: [200] }}
      />
    </div>
  );
}

export default observer(Editor);

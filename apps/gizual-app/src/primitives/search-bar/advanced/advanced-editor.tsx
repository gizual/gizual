import { useTheme } from "@app/utils";
import Editor, { useMonaco } from "@monaco-editor/react";
import { observer } from "mobx-react-lite";
import React from "react";

import { SearchBarViewModel } from "../search-bar.vm";

import style from "./advanced-editor.module.scss";
import { defaultQuery, getSchema } from "./json-schema";

export type AdvancedEditorProps = {
  vm: SearchBarViewModel;
};

function handleEditorValidation(markers: any) {
  // model markers
  for (const marker of markers) console.log("onValidate:", marker.message);
}

export const AdvancedEditor = observer(({ vm: _vm }: AdvancedEditorProps) => {
  const monaco = useMonaco();
  const theme = useTheme();

  React.useEffect(() => {
    if (!monaco) return;
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      schemaRequest: "error",
      schemaValidation: "error",
      validate: true,
      schemas: [
        {
          uri: "gizual://json",
          fileMatch: ["*"],
          schema: getSchema(),
        },
      ],
    });
  }, [monaco]);

  if (!monaco) return <></>;

  return (
    <div>
      <Editor
        className={style.AdvancedEditor}
        defaultLanguage="json"
        defaultValue={defaultQuery}
        onValidate={handleEditorValidation}
        width="unset"
        theme={theme === "light" ? "light" : "vs-dark"}
      ></Editor>
    </div>
  );
});

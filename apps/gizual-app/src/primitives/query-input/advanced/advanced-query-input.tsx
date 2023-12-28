import { useTheme } from "@app/utils";
import { Tooltip } from "@mantine/core";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";
import { getSchema } from "@giz/query";
import { Validator } from "@giz/query/validator";
import { Button } from "../../button";

import style from "./advanced-query-input.module.scss";
import { CompletionProvider } from "./completion-provider";

function handleEditorWillMount(editor: Monaco) {
  editor.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ["_", "."],
    provideCompletionItems: (model, position) =>
      CompletionProvider.provideCompletionItems(editor, model, position),
  });
}

function handleEditorDidMount(editor: Monaco) {
  editor.languages.json.jsonDefaults.setDiagnosticsOptions({
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
}

export const AdvancedEditor = observer(() => {
  const { query, setQuery } = useQuery();
  const [validationOutput, setValidationOutput] = React.useState<string[]>([]);
  const [editorContent, setEditorContent] = React.useState<string>(
    JSON.stringify(query, undefined, 1),
  );

  React.useEffect(() => {
    setEditorContent(JSON.stringify(query, undefined, 1));
  }, [query]);

  const monacoInstance = useMonaco();

  const theme = useTheme();
  function handleEditorValidation(markers: any) {
    setValidationOutput([]);
    for (const marker of markers)
      setValidationOutput([...validationOutput, marker.message as string]);
  }

  function parseInput(e: string | undefined) {
    if (e === undefined) return;
    setEditorContent(e);
  }

  const containsErrors = validationOutput.length > 0;

  if (!monacoInstance) return <></>;

  return (
    <div className={style.AdvancedEditorContainer}>
      <Editor
        className={style.AdvancedEditor}
        defaultLanguage="json"
        value={JSON.stringify(query, undefined, 1)}
        onValidate={handleEditorValidation}
        beforeMount={handleEditorWillMount}
        onMount={(_e, m) => handleEditorDidMount(m)}
        onChange={(e) => parseInput(e)}
        width="unset"
        theme={theme === "light" ? "light" : "vs-dark"}
        height="unset" // Populated through CSS
      ></Editor>
      {containsErrors && <>Validation error: {validationOutput.join(", ")}</>}
      <div className={style.EditorActionGroup}>
        <Button
          variant="filled"
          disabled={validationOutput.length > 0}
          onClick={() => {
            const result = Validator.validate(editorContent);
            if (result !== undefined) {
              setQuery(result);
            }
          }}
        >
          Run query
        </Button>
        <Tooltip label="Save button is not yet implemented.">
          <Button variant="filled" onClick={() => console.log("TODO: Should save query!")} disabled>
            Save query
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});

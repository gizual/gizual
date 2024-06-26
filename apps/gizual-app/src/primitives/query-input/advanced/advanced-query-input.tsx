import { usePreferredColorScheme } from "@app/hooks/use-preferred-color-scheme";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";
import { getSchema } from "@giz/query";
import { Loading } from "../../loading";
import { QueryViewModel } from "../query.vm";

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

export type AdvancedEditorProps = {
  vm: QueryViewModel;
};

export const AdvancedEditor = observer(({ vm }: AdvancedEditorProps) => {
  const { query, errors } = useQuery();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    vm.setEditorContent(JSON.stringify(query, undefined, 1));
    vm.setValidationOutput([]);
  }, [query]);

  const monacoInstance = useMonaco();

  const preferredColorScheme = usePreferredColorScheme();

  function parseInput(e: string | undefined) {
    if (e === undefined) return;
    vm.setEditorContent(e);
  }

  if (!monacoInstance) return <></>;

  return (
    <div className={style.AdvancedEditorContainer}>
      {isLoading && <Loading />}
      <Editor
        className={clsx(style.AdvancedEditor, isLoading && style.AdvancedEditorLoading)}
        defaultLanguage="json"
        value={JSON.stringify(query, undefined, 2)}
        onValidate={vm.handleEditorValidation.bind(vm)}
        beforeMount={handleEditorWillMount}
        onMount={(_e, m) => {
          handleEditorDidMount(m);
          setIsLoading(false);
        }}
        onChange={(e) => parseInput(e)}
        width="unset"
        theme={preferredColorScheme === "light" ? "light" : "vs-dark"}
        height="100%"
      ></Editor>
      <pre>{vm.contentHasErrors && <>Validation error: {vm.validationOutput.join(", ")}</>}</pre>
      {errors && errors.length > 0 && <pre>{JSON.stringify(errors, undefined, 2)}</pre>}
    </div>
  );
});

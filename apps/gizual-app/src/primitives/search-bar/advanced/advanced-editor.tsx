import { useMainController } from "@app/controllers";
import { DATE_FORMAT, GizDate, useTheme } from "@app/utils";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import dayjs from "dayjs";
import * as ejs from "ejs";
import { observer } from "mobx-react-lite";
import React from "react";

import { getSchema } from "../../advanced-query";
import { Validator } from "../../advanced-query/validator";
import { Button } from "../../button";
import { SearchBarViewModel } from "../search-bar.vm";

import style from "./advanced-editor.module.scss";
import { CompletionProvider } from "./completion-provider";

export type AdvancedEditorProps = {
  vm: SearchBarViewModel;
};

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

export const AdvancedEditor = observer(({ vm }: AdvancedEditorProps) => {
  const mainController = useMainController();
  const getDefaultQuery = () => {
    return `{
  "time": {
    "rangeByDate": ["${mainController.selectedStartDate.toString()}","${mainController.selectedEndDate.toString()}"]
  }
}`;
  };
  const [validationOutput, setValidationOutput] = React.useState<string[]>([]);
  const [editorContent, setEditorContent] = React.useState<string>(getDefaultQuery());
  const monacoInstance = useMonaco();
  const theme = useTheme();

  const context = {
    _: {
      age: 25,
      author: "joe",
      commitDate: "2021-06-01",
      gradient: function (age: any) {
        return `rgba(${age}, ${age}, ${age}, 1)`;
      },
    },
  };

  const parseInput = (e?: string) => {
    if (!e) return;
    const ejsOut = ejs.render(e, context, {});
    console.log("EJS Context:", context);
    console.log("EJS Out:", ejsOut);
    setEditorContent(e);
  };

  function handleEditorValidation(markers: any) {
    setValidationOutput([]);
    for (const marker of markers)
      setValidationOutput([...validationOutput, marker.message as string]);
  }

  const containsErrors = validationOutput.length > 0;

  if (!monacoInstance) return <></>;

  return (
    <div className={style.AdvancedEditorContainer}>
      <Editor
        className={style.AdvancedEditor}
        defaultLanguage="json"
        defaultValue={getDefaultQuery()}
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
            // Proof of concept for advanced-search queries
            const result = Validator.validate(editorContent);
            if (result !== undefined) {
              // eslint-disable-next-line unicorn/no-lonely-if
              if (result.time && "rangeByDate" in result.time) {
                if (typeof result.time.rangeByDate === "string") {
                  const date = dayjs(result.time.rangeByDate, DATE_FORMAT);
                  if (date && date.isValid()) {
                    mainController.setSelectedStartDate(new GizDate(date.toDate()));
                  }
                } else {
                  const [startDate, endDate] = result.time.rangeByDate;
                  const parsedStartDate = dayjs(startDate, DATE_FORMAT);
                  if (parsedStartDate && parsedStartDate.isValid()) {
                    mainController.setSelectedStartDate(new GizDate(parsedStartDate.toDate()));
                  }
                  const parsedEndDate = dayjs(endDate, DATE_FORMAT);
                  if (parsedEndDate && parsedEndDate.isValid()) {
                    mainController.setSelectedEndDate(new GizDate(parsedEndDate.toDate()));
                  }
                }
              }
            }
          }}
        >
          Run query
        </Button>
        <Button variant="filled" onClick={() => vm.queryManager.storeQuery("abc", "")}>
          Save query
        </Button>
      </div>
    </div>
  );
});

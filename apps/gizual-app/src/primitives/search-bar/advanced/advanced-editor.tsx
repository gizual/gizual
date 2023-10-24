import { useTheme } from "@app/utils";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import * as ejs from "ejs";
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";

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

const customCompletionItems = [
  {
    label: "_.age",
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: "_.age",
    detail: "Resolves to the age of an individual line within the visualization.",
  },
  {
    label: "_.author",
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: "_.author",
    detail: "Resolves to the author of an individual line within the visualization.",
  },
  {
    label: "_.commitDate",
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: "_.commitDate",
    detail: "Resolves to the commit date of an individual line within the visualization.",
  },
  {
    label: "_.gradient",
    kind: monaco.languages.CompletionItemKind.Variable,
    insertText: "_.gradient()",
    detail: "Function that takes the given input variable and creates a gradient based on it.",
  },
];

function handleEditorWillMount(editor: Monaco) {
  editor.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ["_", "."],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      if (word.word.startsWith("_.") || word.word === "_") {
        return {
          suggestions: customCompletionItems.map((item) => ({
            ...item,
            range,
          })),
        };
      }

      //if (isCursorInsideFunction("gradient", model, position)) {
      //  return {
      //    suggestions: customCompletionItems.map((item) => ({
      //      ...item,
      //      range,
      //    })),
      //  };
      //}

      return { suggestions: [] };
    },
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

// Check if the cursor is within a pair of function parentheses.
function isCursorInsideFunction(
  functionName: string,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
) {
  // Extract the text in the current line up to the cursor position
  const textUntilPosition = model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });
  console.log("isCursorInsideFunction", textUntilPosition);

  const functionPattern = new RegExp(`\\b${functionName}\\s*\\(\\s*[^)]*$`, "i");
  return functionPattern.test(textUntilPosition);
}

export const AdvancedEditor = observer(({ vm: _vm }: AdvancedEditorProps) => {
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
  };

  if (!monacoInstance) return <></>;

  return (
    <div>
      <Editor
        className={style.AdvancedEditor}
        defaultLanguage="json"
        defaultValue={defaultQuery}
        onValidate={handleEditorValidation}
        beforeMount={handleEditorWillMount}
        onMount={(_e, m) => handleEditorDidMount(m)}
        onChange={(e) => parseInput(e)}
        width="unset"
        theme={theme === "light" ? "light" : "vs-dark"}
      ></Editor>
    </div>
  );
});

import type * as monacoType from "monaco-editor";
type Monaco = typeof monacoType;

// Omit the range from the type because we're populating it in the CompletionProvider
type CompletionItem = Omit<monacoType.languages.CompletionItem, "range">;

function getCompletionItems(monaco: Monaco): CompletionItem[] {
  const completionItems = [
    {
      label: "age",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "age",
      detail: "Resolves to the age of an individual line within the visualization.",
    },
    {
      label: "author",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "author",
      detail: "Resolves to the author of an individual line within the visualization.",
    },
    {
      label: "commitDate",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "commitDate",
      detail: "Resolves to the commit date of an individual line within the visualization.",
    },
    {
      label: "gradient",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "gradient()",
      detail: "Function that takes the given input variable and creates a gradient based on it.",
    },
  ];

  return completionItems;
}

export const CompletionProvider = {
  provideCompletionItems(
    monaco: Monaco,
    model: monacoType.editor.ITextModel,
    position: monacoType.Position,
  ) {
    const word = model.getWordUntilPosition(position);

    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    if (word.word.startsWith("_.") || word.word === "_") {
      return {
        suggestions: getCompletionItems(monaco).map((item) => ({
          ...item,
          range,
        })),
      };
    }

    return { suggestions: [] };
  },
};

// Check if the cursor is within a pair of function parentheses.
function _isCursorInsideFunction(
  functionName: string,
  model: monacoType.editor.ITextModel,
  position: monacoType.Position,
) {
  // Extract the text in the current line up to the cursor position
  const textUntilPosition = model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });

  const functionPattern = new RegExp(`\\b${functionName}\\s*\\(\\s*[^)]*$`, "i");
  return functionPattern.test(textUntilPosition);
}

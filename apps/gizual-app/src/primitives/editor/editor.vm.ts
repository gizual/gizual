import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { autorun, makeAutoObservable } from "mobx";
import React from "react";

import { MainController } from "../../controllers";
import { FileViewModel } from "../file/file.vm";

export class EditorViewModel {
  _editorRef: React.RefObject<HTMLDivElement> | undefined;
  _editor: EditorView | undefined;
  _mainController: MainController;
  _file: FileViewModel;

  constructor(file: FileViewModel, mainController: MainController) {
    this._mainController = mainController;
    this._file = file;

    makeAutoObservable(this, {}, { autoBind: true });

    autorun(() => {
      if (!this._file.loading) this.setupEditor();
    });
  }

  setEditorRef(editorRef: React.RefObject<HTMLDivElement>) {
    this._editorRef = editorRef;
  }

  setupEditor() {
    if (!this._editorRef) {
      return;
    }
    if (!this._editorRef.current) {
      return;
    }
    if (this._editor) {
      return;
    }

    const fixedHeightEditor = EditorView.theme({
      "&": {
        height: "100%",
        width: "50vw",
        maxHeight: "80vh",
        maxWidth: "90vw",
        minWidth: "10vw",
        minHeight: "10vh",
      },
      ".cm-scroller": { overflow: "auto" },
      //".cm-blame-gutter": { color: "gray" },
    });

    const content = this._file.fileContent.map((c) => c.content).join("\n");

    const gitMarker = new (class extends GutterMarker {
      toDOM() {
        const div = document.createElement("div");
        div.style.width = "0.25rem";
        div.style.height = "1.25rem";
        div.style.backgroundColor = "green";
        return div;
      }
    })();

    const file = this._file;
    const mainController = this._mainController;

    const gitGutter: Extension = gutter({
      class: "cm-blame-gutter",
      lineMarker(view, line, _) {
        return new (class extends GutterMarker {
          _file: FileViewModel;
          _mainController: MainController;
          constructor(file: FileViewModel, mainController: MainController) {
            super();
            this._file = file;
            this._mainController = mainController;
          }
          toDOM() {
            const lineNumber = view.state.doc.lineAt(line.from).number - 1;
            const fileContent = this._file.fileContent;
            const lineContent = fileContent[lineNumber];
            const authorId = lineContent.commit?.authorId;
            const authorName = authorId
              ? this._file._mainController.getAuthorById(authorId)?.name
              : "Unknown Author";

            const div = document.createElement("div");
            const gutterStyle =
              this._mainController.settingsController.settings.editor.gutterStyle.value;
            div.className = "GitGutter";
            div.style.width = gutterStyle === "author" ? "8rem" : "0.5rem";
            div.style.backgroundColor =
              (this._file.colours && this._file.colours[lineNumber]) ??
              this._mainController.settingsController.settings.visualisationSettings.colours
                .notLoaded;

            if (gutterStyle === "author") {
              div.textContent =
                new Date(
                  Number(this._file.fileContent[lineNumber].commit?.timestamp ?? 0) * 1000,
                ).toDateString() +
                " - " +
                authorName;

              div.title = this._file.fileContent[lineNumber].commit?.message ?? "";
            }
            return div;
          }
        })(file, mainController);
      },
      initialSpacer: () => gitMarker,
    });

    this._editor = new EditorView({
      parent: this._editorRef.current,
      doc: content,
      extensions: [
        basicSetup,
        fixedHeightEditor,
        oneDark,
        EditorState.readOnly.of(true),
        javascript({ jsx: true, typescript: true }),
        gitGutter,
      ],
    });
  }
}

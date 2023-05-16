import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { makeAutoObservable } from "mobx";
import React from "react";

import { MainController } from "../../controllers";
import {FileViewModel} from "../file/file.vm";

export class EditorViewModel {
  _editorRef: React.RefObject<HTMLDivElement> | undefined;
  _editor: EditorView | undefined;
  _mainController: MainController;
  _file: FileViewModel;

  constructor(file: FileViewModel, mainController: MainController) {
    this._mainController = mainController;

    this._file = file;
    makeAutoObservable(this);
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
        div.style.height="1.25rem";
        div.style.backgroundColor = "green";
        return div;
      }
    })();

    const file = this._file;

    const gitGutter = gutter({
      class: "cm-blame-gutter",
      lineMarker(view, line, other) {
        return new (class extends GutterMarker {
            _file: FileViewModel;
          constructor(file: FileViewModel){super();this._file = file;}
          toDOM() {
            const lineNumber = view.state.doc.lineAt(line.from).number - 1;
            const div = document.createElement("div");
            div.style.width = "0.5rem";
            div.style.height ="1.5rem";
            div.style.backgroundColor = this._file.fileContent[lineNumber].color ?? "#232323";
            div.title = this._file.fileContent[lineNumber].commit?.hash ?? "";
            return div;
          }
        })(file);
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

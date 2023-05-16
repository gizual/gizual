import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { makeAutoObservable } from "mobx";
import React from "react";

import { MainController } from "../../controllers";
import { Line } from "../file/file.vm";

export class EditorViewModel {
  _editorRef: React.RefObject<HTMLDivElement> | undefined;
  _editor: EditorView | undefined;
  _mainController: MainController;
  _content: Line[];

  constructor(content: Line[], mainController: MainController) {
    this._mainController = mainController;
    this._content = content;
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
        width: "100%",
        maxHeight: "80vh",
        maxWidth: "90vw",
        minWidth: "10vw",
        minHeight: "10vh",
      },
      ".cm-scroller": { overflow: "auto" },
      //".cm-blame-gutter": { color: "gray" },
    });

    const content = this._content.map((c) => c.content).join("\n");

    const gitMarker = new (class extends GutterMarker {
      toDOM() {
        return document.createTextNode("|");
      }
    })();

    const gitGutter = gutter({
      class: "cm-blame-gutter",
      lineMarker(view, line) {
        return gitMarker;
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
      ],
    });
  }
}

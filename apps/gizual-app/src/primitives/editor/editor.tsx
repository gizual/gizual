import { usePreferredColorScheme } from "@app/hooks/use-preferred-color-scheme";
import { useViewModel } from "@app/services/view-model";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";

import { DialogPortal } from "../dialog-provider";
import { Loading } from "../loading";

import style from "./editor.module.scss";
import { EditorViewModel } from "./editor.vm";

const Editor = observer(() => {
  const vm = useViewModel(EditorViewModel);
  const theme = usePreferredColorScheme();

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    _monaco: typeof monaco | null,
  ) {
    //editor.createDecorationsCollection([]);
    vm.setEditorInstance(editor);
  }

  return (
    <DialogPortal
      isOpen={vm.modalState === "open"}
      setIsOpen={vm.setModalState}
      contentStyle={{ overflow: "hidden", padding: 0 }}
      title={vm.title}
    >
      <div className={style.EditorContainer}>
        {vm.contentLoading && <Loading />}
        <MonacoEditor
          className={clsx(style.Editor)}
          defaultLanguage="json"
          value={vm.fileContent}
          onMount={handleEditorDidMount}
          theme={theme === "light" ? "light" : "vs-dark"}
          height="100%"
          width="100%"
          options={{
            readOnly: true,
            rulers: [200],
            colorDecorators: true,
            glyphMargin: true,
          }}
        />
      </div>
    </DialogPortal>
  );
});

export { Editor };

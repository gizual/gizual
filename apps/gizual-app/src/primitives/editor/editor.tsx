import { observer } from "mobx-react-lite";
import React from "react";

import { useMainController } from "../../controllers";
import { FileViewModel } from "../file/file.vm";

import style from "./editor.module.scss";
import { EditorViewModel } from "./editor.vm";

type EditorProps = {
  vm?: EditorViewModel;
  file: FileViewModel;
};

function Editor({ vm: externalVm, file }: EditorProps) {
  const mainController = useMainController();

  const vm: EditorViewModel = React.useMemo(() => {
    return externalVm || new EditorViewModel(file, mainController);
  }, [externalVm]);

  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    vm.setEditorRef(editorRef);
    vm.setupEditor();
  }, [editorRef]);

  return (
    <div className={style.editorContainer}>
      <h1 className={style.editorHeader}>File View</h1>
      <div className={style.editor} ref={editorRef}></div>
    </div>
  );
}

export default observer(Editor);

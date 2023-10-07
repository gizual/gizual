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
  }, [editorRef]);

  return (
    <div className={style.EditorContainer}>
      <div className={style.Editor} ref={editorRef} />
    </div>
  );
}

export default observer(Editor);

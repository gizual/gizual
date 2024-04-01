import { usePreferredColorScheme } from "@app/hooks/use-preferred-color-scheme";
import { useViewModel } from "@app/services/view-model";
import { Editor as MonacoEditor, useMonaco } from "@monaco-editor/react";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import { DialogPortal } from "../dialog-provider";
import { Loading } from "../loading";

import style from "./editor.module.scss";
import { EditorViewModel } from "./editor.vm";

const Editor = observer(() => {
  const [isMounted, setIsMounted] = React.useState(false);
  const vm = useViewModel(EditorViewModel);

  const monacoInstance = useMonaco();

  const theme = usePreferredColorScheme();

  if (!monacoInstance) return <></>;

  return (
    <DialogPortal
      isOpen={vm.modalState === "open"}
      setIsOpen={vm.setModalState}
      contentStyle={{ overflow: "hidden", padding: 0 }}
      title={vm.title}
    >
      <div className={style.EditorContainer}>
        {(!isMounted || vm.contentLoading) && <Loading />}
        <MonacoEditor
          className={clsx(style.Editor)}
          defaultLanguage="json"
          value={vm.fileContent}
          onMount={(_e, _m) => {
            setIsMounted(true);
          }}
          theme={theme === "light" ? "light" : "vs-dark"}
          height="100%"
          width="100%"
          options={{ readOnly: true, rulers: [200] }}
        />
      </div>
    </DialogPortal>
  );
});

export { Editor };

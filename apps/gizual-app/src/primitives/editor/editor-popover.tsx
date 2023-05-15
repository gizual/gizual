import * as Popover from "@radix-ui/react-popover";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { ReactComponent as Source } from "../../assets/icons/source.svg";
import { Line } from "../file/file.vm";

import style from "./editor.module.scss";
import { EditorPopoverViewModel } from "./editor-popover.vm";
import { Editor } from "./index";

type EditorPopoverProps = {
  vm?: EditorPopoverViewModel;
  content: Line[];
};
function EditorPopover({ vm: externalVm, content }: EditorPopoverProps) {
  const vm: EditorPopoverViewModel = React.useMemo(() => {
    return externalVm || new EditorPopoverViewModel();
  }, [externalVm]);

  return (
    <Popover.Root open={vm.isVisible} modal>
      <div id="overlay"></div>
      <Popover.Trigger asChild onClick={() => vm!.open()}>
        <Source className={style.sourceIcon} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={style.PopoverContent}>
          <Editor content={content} />
          <Popover.Close
            className={style.PopoverClose}
            aria-label="Close"
            onClick={() => vm.closePopover()}
          >
            <CloseIcon />
          </Popover.Close>
          <Popover.Arrow className={style.PopoverArrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default observer(EditorPopover);

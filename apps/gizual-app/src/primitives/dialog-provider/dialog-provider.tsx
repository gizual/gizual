import * as Dialog from "@radix-ui/react-dialog";
import { observer } from "mobx-react-lite";
import React from "react";

import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";

import style from "./dialog-provider.module.scss";
import { DialogProviderViewModel } from "./dialog-provider.vm";

export type PopoverProviderProps = {
  trigger: React.ReactNode | React.ReactNode[];
  children: React.ReactNode | React.ReactNode[];
  vm?: DialogProviderViewModel;
};
function DialogProvider({ vm: externalVm, trigger, children }: PopoverProviderProps) {
  const vm: DialogProviderViewModel = React.useMemo(() => {
    return externalVm || new DialogProviderViewModel();
  }, [externalVm]);

  return (
    <Dialog.Root open={vm.isVisible} modal>
      <Dialog.Trigger asChild={false} onClick={() => vm!.open()}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={style.DialogOverlay} onClick={() => vm.closePopover()} />
        <Dialog.Content className={style.DialogContent}>
          {children}
          <Dialog.Close
            asChild
            className={style.DialogClose}
            aria-label="Close"
            onClick={() => vm.closePopover()}
          >
            <CloseIcon />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default observer(DialogProvider);

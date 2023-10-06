import { useMainController } from "@app/controllers";
import clsx from "clsx";
import { observer } from "mobx-react-lite";

import { ReactComponent as TrashIcon } from "../../../assets/icons/trash.svg";
import style from "../search-bar.module.scss";
import { AvailableTagId } from "../search-tags";

export type CommonInputAssistProps = {
  tagId: AvailableTagId;
};

export const CommonInputAssist = observer(({ tagId }: CommonInputAssistProps) => {
  const mainController = useMainController();

  const vm = mainController.vmController.searchBarViewModel;
  if (!vm) return <></>;

  const selectedTag = vm.tags.find((t) => t.tag.id === tagId);
  if (!selectedTag) return <></>;

  return (
    <>
      <hr />
      <div
        className={clsx(style.SearchOverlayHintEntry, style.RemoveTagEntry)}
        onClick={() => {
          vm.removeTag(selectedTag);
        }}
      >
        <TrashIcon style={{ margin: 0 }} />
        <p>Remove Tag</p>
      </div>
    </>
  );
});

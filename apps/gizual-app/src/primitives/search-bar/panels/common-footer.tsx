import { IconTrash } from "@app/assets";
import { useMainController } from "@app/controllers";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

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
    <React.Fragment key={tagId}>
      <hr />
      <div
        className={clsx(style.SearchOverlayHintEntry, style.RemoveTagEntry)}
        onClick={() => {
          vm.removeTag(selectedTag);
        }}
      >
        <IconTrash style={{ margin: 0 }} />
        <p>Remove Tag</p>
      </div>
    </React.Fragment>
  );
});

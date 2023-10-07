import { useMainController } from "@app/controllers";
import { observer } from "mobx-react-lite";

import { FileTree } from "../..";
import { AvailableTagId } from "../search-tags";

export type FileInputAssistProps = {
  tagId: AvailableTagId;
};

export const FileInputAssist = observer(({ tagId }: FileInputAssistProps) => {
  const mainController = useMainController();

  const vm = mainController.vmController.searchBarViewModel;
  if (!vm) return <></>;

  const selectedTag = vm.tags.find((t) => t.tag.id === tagId);
  if (!selectedTag) return <></>;

  return (
    <>
      <FileTree />
    </>
  );
});

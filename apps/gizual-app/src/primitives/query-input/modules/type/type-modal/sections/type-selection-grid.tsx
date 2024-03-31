import { RadioGrid, RadioGridItem } from "@app/primitives/radio-grid";
import { observer } from "mobx-react-lite";

import { RenderTypeQueryType } from "@giz/query";
import { VisTypeViewModel } from "../type-modal.vm";

const TypeSelectionGrid = observer(({ vm }: { vm: VisTypeViewModel }) => {
  const type = vm.selectedType;
  const onChange = (type: RenderTypeQueryType) => {
    vm.setSelectedType(type);
  };

  return (
    <RadioGrid>
      <RadioGridItem<RenderTypeQueryType>
        value="file-lines"
        onChange={onChange}
        title="File Lines"
        checked={type === "file-lines"}
        description="Displays file content as a series of colored lines. Each line represents a line of code."
        inputName="type"
      />

      <RadioGridItem<RenderTypeQueryType>
        value="file-lines-full"
        onChange={onChange}
        title="File Lines Full Width"
        checked={type === "file-lines-full"}
        description="Displays file content as a series of full-width colored lines. Each line represents a line of code."
        inputName="type"
      />

      <RadioGridItem<RenderTypeQueryType>
        value="file-mosaic"
        onChange={onChange}
        title="File Mosaic"
        checked={type === "file-mosaic"}
        description="Displays file content as a mosaic of colored tiles. Each tile represents a line of code."
        inputName="type"
      />

      <RadioGridItem<RenderTypeQueryType>
        value="author-mosaic"
        onChange={onChange}
        title="Author Mosaic"
        checked={type === "author-mosaic"}
        description="Displays a mosaic for each author. Each tile represents a file modified by the author."
        inputName="type"
        disabled
        comingSoon
      />

      <RadioGridItem<RenderTypeQueryType>
        value="author-contributions"
        onChange={onChange}
        title="Author Contributions"
        checked={type === "author-contributions"}
        description="Displays a tiled mosaic for the amount of contributions an author has made over time."
        inputName="type"
        disabled
        comingSoon
      />

      <RadioGridItem<RenderTypeQueryType>
        value="file-bar"
        onChange={onChange}
        title="File Bar"
        checked={type === "file-bar"}
        description="Displays each file as a stacked bar, with individual segments representing different metrics."
        inputName="type"
        disabled
        comingSoon
      />

      <RadioGridItem<RenderTypeQueryType>
        value="author-bar"
        onChange={onChange}
        title="Author Bar"
        checked={type === "author-bar"}
        description="Displays each author as a stacked bar, with individual segments representing different metrics."
        inputName="type"
        disabled
        comingSoon
      />
    </RadioGrid>
  );
});

export { TypeSelectionGrid };

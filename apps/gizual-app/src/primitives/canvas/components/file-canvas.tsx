import { useMainController } from "@app/controllers";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import { match, Pattern } from "ts-pattern";

import { createLogger } from "@giz/logging";
import { FileBlock } from "../../file/block";
import { MasonryGrid } from "../../masonry";
import { CanvasContext } from "../canvas.context";
import { CanvasViewModel } from "../canvas.vm";

const logger = createLogger("masonry-canvas");

type MasonryCanvasProps = {
  vm: CanvasViewModel;
  wrapper: HTMLDivElement | undefined | null;
};

/**
 * This component is responsible for rendering the content of the canvas inside
 * our custom masonry grid implementation. It decides on which blocks to render
 * based on the current query input, and must always produce a stable output.
 */
export const MasonryCanvas = observer(({ vm, wrapper }: MasonryCanvasProps) => {
  const mainController = useMainController();
  const settingsController = mainController.settingsController;

  const blocks = useContext(CanvasContext).useBlocks();

  logger.debug({ blocks, wrapper, cw: vm.canvasWidth });
  return (
    <>
      <MasonryGrid
        childInfo={blocks.map((f) => {
          return { id: f.id, height: f.height + 26 };
        })}
        numColumns={settingsController.settings.visualizationSettings.canvas.masonryColumns.value}
      >
        {blocks.map((block, index) => {
          if (!wrapper) return <React.Fragment key={index}></React.Fragment>;

          return match(block)
            .with(Pattern.union({ type: "file-lines" }, { type: "file-mosaic" }), (b) => (
              <FileBlock
                key={`${b.id} ${b.height}`}
                parentContainer={wrapper}
                id={b.id}
                filePath={b.filePath}
                fileType={b.fileType}
                height={b.height}
              />
            ))
            .otherwise(() => <></>);
        })}
      </MasonryGrid>
    </>
  );
});

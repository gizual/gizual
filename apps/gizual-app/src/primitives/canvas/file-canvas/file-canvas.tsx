import { useMainController } from "@app/controllers";
import { Loader } from "@mantine/core";
import { observer } from "mobx-react-lite";
import React from "react";

import { useBlockHeights } from "@giz/maestro/react";
import { FileBlock } from "../../file/block";
import { MasonryGrid } from "../../masonry";
import { CanvasViewModel } from "../canvas.vm";

type FileCanvasProps = {
  vm: CanvasViewModel;
  wrapper: HTMLDivElement | undefined | null;
};

export const FileCanvas = observer(({ vm, wrapper }: FileCanvasProps) => {
  const mainController = useMainController();
  const blocks = useBlockHeights();
  console.log({ blocks, wrapper, cw: vm.canvasWidth });
  return (
    <>
      {!mainController.repoController.isDoneEstimatingSize && (
        <>
          <h2>Estimating size - please wait.</h2>
          <Loader />
        </>
      )}

      <MasonryGrid
        width={vm.canvasWidth}
        childInfo={blocks.map((f) => {
          return { id: f.id, height: f.height + 26 };
        })}
      >
        {blocks.map((block, index) => {
          if (!wrapper) return <React.Fragment key={index}></React.Fragment>;

          //console.log("I should render", block);

          return (
            <FileBlock
              key={block.id}
              parentContainer={wrapper}
              id={block.id}
              height={block.height}
            />
          );
        })}
      </MasonryGrid>
    </>
  );
});

import { useMainController } from "@app/controllers";
import { Spin } from "antd";
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
  console.log({ blocks });
  return (
    <>
      {!mainController.repoController.isDoneEstimatingSize && (
        <>
          <h2>Estimating size - please wait.</h2>
          <Spin size={"large"} />
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

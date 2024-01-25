import { useMainController } from "@app/controllers";
import { Loader } from "@mantine/core";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import { match } from "ts-pattern";

import { FileBlock } from "../../file/block";
import { MasonryGrid } from "../../masonry";
import { CanvasContext } from "../canvas.context";
import { CanvasViewModel } from "../canvas.vm";

type FileCanvasProps = {
  vm: CanvasViewModel;
  wrapper: HTMLDivElement | undefined | null;
};

export const FileCanvas = observer(({ vm, wrapper }: FileCanvasProps) => {
  const mainController = useMainController();
  const blocks = useContext(CanvasContext).useBlocks();

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

          return match(block)
            .with({ type: "file-lines" }, (b) => (
              <FileBlock
                key={b.id}
                parentContainer={wrapper}
                id={b.id}
                filePath={b.filePath}
                fileType={b.fileType}
                height={block.height}
              />
            ))
            .otherwise(() => <></>);
        })}
      </MasonryGrid>
    </>
  );
});

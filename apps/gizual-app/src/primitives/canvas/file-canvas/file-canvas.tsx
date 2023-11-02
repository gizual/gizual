import { useMainController } from "@app/controllers";
import { Spin } from "antd";
import { observer } from "mobx-react-lite";
import React from "react";

import { File } from "../../file";
import { MasonryGrid } from "../../masonry";
import { CanvasViewModel } from "../canvas.vm";

type FileCanvasProps = {
  vm: CanvasViewModel;
  wrapper: HTMLDivElement | undefined | null;
};

export const FileCanvas = observer(({ vm, wrapper }: FileCanvasProps) => {
  const mainController = useMainController();
  return (
    <>
      {!vm.hasLoadedFiles && <h2>No files loaded. Use the search bar to select something.</h2>}
      {vm.hasLoadedFiles && (
        <>
          {!mainController.repoController.isDoneEstimatingSize && (
            <>
              <h2>Estimating size - please wait.</h2>
              <Spin size={"large"} />
            </>
          )}
          {mainController.repoController.isDoneEstimatingSize && (
            <MasonryGrid
              width={vm.canvasWidth}
              childInfo={vm.loadedFiles.map((f) => {
                return { id: f.name, height: f.calculatedHeight + 26 };
              })}
            >
              {vm.loadedFiles.map((file, index) => {
                if (!wrapper || !file.isValid) return <React.Fragment key={index}></React.Fragment>;

                return <File file={file} key={index} parentContainer={wrapper} />;
              })}
            </MasonryGrid>
          )}
        </>
      )}
    </>
  );
});

import { useMainController } from "@app/controllers";
import { observer } from "mobx-react-lite";

import { CanvasViewModel } from "../canvas.vm";

type AuthorCanvasProps = {
  vm: CanvasViewModel;
  wrapper: HTMLDivElement | undefined | null;
};

export const AuthorCanvas = observer(({ vm, wrapper }: AuthorCanvasProps) => {
  const mainController = useMainController();
  return <></>;
});

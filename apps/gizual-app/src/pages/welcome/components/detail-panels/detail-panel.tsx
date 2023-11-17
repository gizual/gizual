import { WelcomeViewModel } from "../../welcome.vm";

export type DetailPanelProps = {
  backArrow?: boolean;
  onBackArrow?: () => void;
  vm: WelcomeViewModel;
};

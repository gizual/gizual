import { useMainController, useViewModelController } from "@app/controllers/main.context";
import React from "react";

import type { Dependencies, ViewModel } from "./view-model";

/**
 * Constructs an instance of the provided ViewModel and handles it's memoization
 * and dependency attachment to the MainController automatically.
 *
 * @param vm - The ViewModel to create an instance of.
 * @param args - The arguments to pass to the ViewModel constructor.
 */
function useViewModel<VM extends ViewModel>(
  vm: new (deps: Dependencies, ...args: any[]) => VM,
  ...args: any[]
) {
  const mainController = useMainController();
  const vmController = useViewModelController();

  const viewModel = React.useMemo(() => {
    const instantiatedViewModel = new vm({ mainController }, ...args);
    if (instantiatedViewModel.id)
      vmController.attach(instantiatedViewModel.id, instantiatedViewModel);

    return instantiatedViewModel;
  }, [mainController, vm]);

  viewModel.init(...args);

  React.useEffect(() => {
    // Cleanup when the component that uses this ViewModel unmounts.
    return () => {
      if (viewModel.id) vmController.detach(viewModel.id);
      viewModel.dispose();
    };
  }, [viewModel, vmController]);

  return viewModel;
}

export { useViewModel };

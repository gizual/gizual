import { IconFilter } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { useLocalQuery } from "@app/services/local-query";
import { Tooltip } from "@mantine/core";
import { observer } from "mobx-react-lite";
import React from "react";
import Joyride, { ACTIONS, CallBackProps, EVENTS, ORIGIN, STATUS } from "react-joyride";

import { QueryEditor } from "./query-editor";
import style from "./query-editor.module.scss";

type QueryEditorModalProps = {
  triggerStyle?: React.CSSProperties;
};
const QueryEditorModal = observer(({ triggerStyle }: QueryEditorModalProps) => {
  const { publishLocalQuery } = useLocalQuery();
  const [isQueryModalOpen, setQueryModalOpen] = React.useState(false);
  const [showJoyride, setShowJoyride] = React.useState(false);

  const joyRideSteps = [
    {
      placement: "center",
      target: "body",
      title: "Guided tour",
      content: "👋 This guided tour should help you get started with our query system.",
    },
    {
      target: "#query-editor-time",
      title: "Query - Time",
      content:
        "This is where you specify the time range for your query. Commits outside this range will be grayed out in the visualization.",
      disableBeacon: true,
    },
    {
      target: "#query-editor-files",
      title: "Query - Files",
      content:
        "Here, you choose the files you want to load. Only files that were present in the selected time-period are available.",
      disableBeacon: true,
    },
    {
      target: "#query-editor-vis",
      title: "Query - Vis",
      content:
        "This section defines the visualization style of your query on the main canvas. You can choose from a variety of visualization styles.",
      disableBeacon: true,
    },
    {
      placement: "center",
      target: "body",
      title: "Start exploring!",
      content: "That's it! You're all set to start exploring your data. Have fun! 🎉",
    },
  ];

  const [joyrideStep, setJoyrideStep] = React.useState(0);
  const elementToHighlight =
    joyrideStep >= joyRideSteps.length || joyRideSteps[joyrideStep].target === "body"
      ? undefined
      : document.querySelector(joyRideSteps[joyrideStep].target);

  elementToHighlight?.classList.add(style.HighlightElement);
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, origin, status, type } = data;

    if (action === ACTIONS.CLOSE && origin === ORIGIN.KEYBOARD) {
      elementToHighlight?.classList.remove(style.HighlightElement);
      setShowJoyride(false);
      setJoyrideStep(0);
    }

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
      // Update state to advance the tour
      elementToHighlight?.classList.remove(style.HighlightElement);
      setJoyrideStep(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      elementToHighlight?.classList.remove(style.HighlightElement);
      setShowJoyride(false);
      setJoyrideStep(0);
    }
  };

  return (
    <>
      <Joyride
        steps={joyRideSteps as any}
        run={showJoyride}
        callback={handleJoyrideCallback}
        stepIndex={joyrideStep}
        continuous
        disableOverlay
        showProgress
        showSkipButton
        styles={{
          options: {
            zIndex: 10_000,
            primaryColor: "var(--accent-main)",
            backgroundColor: "var(--background-secondary)",
            textColor: "var(--foreground-primary)",
            arrowColor: "var(--border-primary)",
          },
          tooltip: {
            fontSize: "1em",
            padding: "0.5rem 0.5rem",
            border: "1px solid var(--border-primary)",
          },
          tooltipContent: {
            padding: "10px 0 0 5px",
          },
        }}
        scrollOffset={60}
      />
      <DialogProvider
        title="Query Editor"
        trigger={
          <Tooltip label="Open query editor modal">
            <IconButton aria-label="Query editor" className={style.TriggerButton}>
              <IconFilter className={style.TriggerButton__Icon} />
            </IconButton>
          </Tooltip>
        }
        triggerClassName={style.Trigger}
        triggerStyle={triggerStyle}
        contentClassName={style.QueryEditorDialog}
        wrapperStyle={{ maxWidth: 900, minWidth: 350, maxHeight: "95dvh" }}
        isOpen={isQueryModalOpen}
        setIsOpen={(isOpen) => {
          if (!isOpen) publishLocalQuery();
          setQueryModalOpen(isOpen);
        }}
        withFooter
        defaultFooterOpts={{
          cancelLabel: "Close",
          okLabel: "Close",
          hasOk: true,
          hasCancel: false,
          onOk: () => {
            publishLocalQuery();
            setQueryModalOpen(false);
          },
          onCancel: () => {
            setQueryModalOpen(false);
          },
        }}
        withHelp
        onHelpClick={() => setShowJoyride(true)}
      >
        <QueryEditor />
      </DialogProvider>
    </>
  );
});

export { QueryEditorModal };

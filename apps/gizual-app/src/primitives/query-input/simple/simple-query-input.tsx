import { IconCommandLine } from "@app/assets";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { IconButton } from "@app/primitives/icon-button";
import { Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { observer } from "mobx-react-lite";
import React from "react";

import { useQuery } from "@giz/maestro/react";
import { AdvancedEditor } from "../advanced/advanced-query-input";
import { QueryViewModel } from "../query.vm";

import { ModuleProvider } from "./module-provider";
import style from "./simple-query-input.module.scss";

export const SimpleQueryInput = observer(() => {
  // Since the Monaco component contains some of the validation logic,
  // it's easier to share state via MobX than to try and pass props around.
  const queryVm = React.useMemo(() => new QueryViewModel(), []);
  const { setQuery, errors } = useQuery();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={style.Container}>
      <div className={style.Clickable}>
        <div className={style.Content}>
          <ModuleProvider />

          <DialogProvider
            title="Advanced Query Builder"
            trigger={
              <Tooltip label="Open advanced query builder">
                <IconButton
                  aria-label="Advanced Query Builder"
                  className={style.AdvancedSearchIconButton}
                >
                  <IconCommandLine className={style.AdvancedSearchIcon} />
                </IconButton>
              </Tooltip>
            }
            triggerClassName={style.AdvancedSearchIconTrigger}
            contentClassName={style.AdvancedSearchDialog}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            withFooter
            defaultFooterOpts={{
              cancelLabel: "Close",
              okLabel: "Run Query",
              hasOk: true,
              hasCancel: true,
              onOk: () => {
                const validationResult = queryVm.validatedQuery;

                if (validationResult.isValid) {
                  setQuery(validationResult.query);
                  setIsOpen(false);
                } else {
                  notifications.show({
                    title: "Invalid Query",
                    message: queryVm.validationOutput,
                    color: "red",
                  });
                }
              },
              onCancel: () => {
                setIsOpen(false);
              },
            }}
          >
            <AdvancedEditor vm={queryVm} />
          </DialogProvider>

          {errors && errors.length > 0 && (
            <Tooltip label={<pre>{JSON.stringify(errors, undefined, 2)}</pre>}>
              <div
                style={{
                  backgroundColor: "red",
                  width: 30,
                  height: 30,
                }}
              ></div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});

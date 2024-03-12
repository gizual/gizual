import { IconGitBranchLine } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Select } from "@app/primitives/select";
import { useLocalQuery } from "@app/services/local-query";
import { observer } from "mobx-react-lite";

import { SearchQueryType } from "@giz/query";
import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

function getBranchEntry(query: SearchQueryType) {
  if (query.branch) return query.branch;
  return "";
}

/**
 * @deprecated This module is deprecated since it has been consolidated with `TimeRangeByDateModule`.
 * @see TimeRangeByDateModule
 */
const BranchModule = observer(() => {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQuery();
  const mainController = useMainController();
  const value = getBranchEntry(localQuery);
  const branches = mainController.branchNames.map((b) => {
    return { label: b, value: b };
  });

  return (
    <BaseQueryModule icon={<IconGitBranchLine />} title={"Branch:"}>
      <div className={style.SpacedChildren}>
        <Select
          onChange={(branch) => {
            updateLocalQuery({ branch });
            publishLocalQuery();
          }}
          value={value}
          data={branches}
          style={{ width: 200 }}
        ></Select>
      </div>
    </BaseQueryModule>
  );
});

export { BranchModule };

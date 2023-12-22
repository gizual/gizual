import { IconGitBranchLine } from "@app/assets";
import { useMainController } from "@app/controllers";
import { Select } from "@app/primitives/select";
import { useLocalQueryCtx } from "@app/utils";
import { observer } from "mobx-react-lite";

import { SearchQueryType } from "@giz/query";
import { BaseQueryModule } from "../base-query-module";
import style from "../modules.module.scss";

function getBranchEntry(query: SearchQueryType) {
  if (query.branch) return query.branch;
  return "";
}

export const BranchModule = observer(() => {
  const { localQuery, updateLocalQuery, publishLocalQuery } = useLocalQueryCtx();
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

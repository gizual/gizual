import { Masonry } from "@app/utils";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";

import style from "./masonry.module.scss";

type ChildInfo = {
  id: string;
  height: number;
};

type MasonryGridProps = {
  children: React.ReactElement[];
  childInfo: ChildInfo[];
  numColumns?: number;
  css?: React.CSSProperties;
  className?: string;
};

export const MasonryGrid = observer(
  ({ children, css, className, numColumns, childInfo }: MasonryGridProps) => {
    const sortedColumns = React.useMemo(() => {
      const masonry = new Masonry<React.ReactElement>({ numColumns });
      for (const [index, child] of children.entries()) {
        if (childInfo[index].height === 0) continue;

        masonry.insertElement({
          id: childInfo[index].id,
          content: child,
          height: childInfo[index].height,
        });
      }
      masonry.sortAndPack();
      return masonry.columns;
    }, [children, childInfo, numColumns]);

    return (
      <div className={clsx(style.Row, className)} style={{ ...css }} key="masonry">
        {sortedColumns &&
          sortedColumns.map((c) => {
            if (c.content.length === 0) return <React.Fragment key={c.index}></React.Fragment>;
            return (
              <div className={style.Column} key={c.index}>
                {c.content.map((e, index) => (
                  <React.Fragment key={index}>{e.content}</React.Fragment>
                ))}
              </div>
            );
          })}
      </div>
    );
  },
);

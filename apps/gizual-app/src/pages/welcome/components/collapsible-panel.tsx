import { IconCollapse } from "@app/assets";
import shared from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";
import { motion } from "framer-motion";
import React from "react";

import style from "../welcome.module.scss";

type CollapsiblePanelProps = {
  title: string;
  titleStyle?: string;
  children: React.ReactNode;
};

export function CollapsiblePanel({ children, title, titleStyle }: CollapsiblePanelProps) {
  const [isCollapsed, setCollapse] = React.useState(false);
  const variants = {
    open: { opacity: 1, height: "auto", padding: "0.5rem", overflow: "visible" },
    collapsed: { opacity: 0, height: 0, padding: "0", overflow: "hidden" },
  };

  return (
    <div className={clsx(style.Collapsible, shared.FlexColumn)}>
      <div
        className={style.CollapsibleHeader}
        onClick={() => {
          setCollapse(!isCollapsed);
        }}
      >
        <IconCollapse
          className={style.CollapseIcon}
          style={{ transform: `rotate(${isCollapsed ? "90deg" : "180deg"})` }}
        />
        <p className={clsx(style.CollapsibleHeaderText, titleStyle)}>{title}</p>
      </div>

      <motion.div
        initial="open"
        animate={isCollapsed ? "collapsed" : "open"}
        variants={variants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={clsx(style.CollapsibleContent)}
      >
        {children}
      </motion.div>
    </div>
  );
}

import shared from "@app/primitives/css/shared-styles.module.scss";
import clsx from "clsx";

import style from "../welcome.module.scss";
import { SupportedBy } from "../welcome.vm";

type OpenRowProps = {
  icon: React.ReactNode;
  title: string;
  supportedBy: SupportedBy[];
  isSelected?: boolean;
  onSelect?: () => void;
};

export function OpenRow({ icon, title, isSelected = false, onSelect = () => {} }: OpenRowProps) {
  return (
    <ul className={clsx(style.OpenRow, shared.FlexRow, isSelected && style.OpenRow__Selected)}>
      <li className={clsx(style.OpenRowLeft, shared.InlineFlexRow)}>
        {icon}
        <a className={style.OpenRowTitle} onClick={() => onSelect()} tabIndex={0}>
          {title}
        </a>
      </li>

      {/*<div className={shared.RightAlignedGroup}>
        {supportedBy.map((browser) => {
          switch (browser) {
            case "chromium": {
              return (
                <Tooltip title="Supported on Chromium-based browsers" key={browser}>
                  <IconChromium className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "firefox": {
              return (
                <Tooltip title="Supported on Firefox" key={browser}>
                  <IconFirefox className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "safari": {
              return (
                <Tooltip title="Supported on Safari" key={browser}>
                  <IconSafari className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "ios": {
              return (
                <Tooltip title="Supported on iOS" key={browser}>
                  <IconIos className={style.BrowserIcon} />
                </Tooltip>
              );
            }
            case "android": {
              return (
                <Tooltip title="Supported on Android" key={browser}>
                  <IconAndroid className={style.BrowserIcon} />
                </Tooltip>
              );
            }
          }
        })}
      </div>*/}
    </ul>
  );
}

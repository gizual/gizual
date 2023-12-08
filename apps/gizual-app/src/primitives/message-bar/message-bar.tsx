import { match } from "ts-pattern";

import style from "./message-bar.module.scss";

export type MessageType = "error" | "warning" | "info";
export type MessageContent = {
  message: string;
  type: MessageType;
};

export function MessageBar() {
  const content: MessageContent[] = [{ message: "TODO: This is a test message :)", type: "info" }];

  if (content.length === 0) return <></>;

  return (
    <div className={style.MessageBar}>
      {content.map((c) => {
        const color = match(c.type)
          .with("info", () => "blue")
          .with("warning", () => "yellow")
          .with("error", () => "red")
          .exhaustive();
        return (
          <div className={style.Message}>
            <div className={style.Bar} style={{ backgroundColor: color }} />
            {c.message}
          </div>
        );
      })}
    </div>
  );
}

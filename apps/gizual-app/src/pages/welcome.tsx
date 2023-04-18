import { useState } from "react";

import { createMsg } from "@giz/explorer";
import baseStyle from "../app.module.scss";
import { Button } from "../primitives/button";

interface WelcomePageProps {
  cb: () => void;
}

function WelcomePage(props: WelcomePageProps) {
  const [messages, setMessage] = useState<string[]>([]);

  const onClick = () => {
    const msg = createMsg("World!");
    setMessage([...messages, msg]);
  };

  return (
    <div className={baseStyle.App}>
      <div className={baseStyle.container}>
        <img className={baseStyle.img} src="./giz.png" alt="Gizual Logo" />
        <h1 className={baseStyle.h1}>Gizual</h1>
        <p className={baseStyle.p}>Welcome to Gizual!</p>
        <div className={baseStyle.card}>
          <Button variant="filled" onClick={onClick} className={baseStyle.button}>
            Test WASM
          </Button>
          {messages.map((m) => {
            return <p className="text-center">{m}</p>;
          })}
        </div>
        <Button
          variant="filled"
          color="gizgunmetal"
          onClick={props.cb}
          className={baseStyle.button}
        >
          {"Skip to main"}
        </Button>
      </div>
    </div>
  );
}

export default WelcomePage;

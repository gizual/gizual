import { useState } from "react";

import { createMsg } from "@giz/explorer";

import style from "./app.module.scss";
import Button from "./primitives/button/button";

function App() {
  const [messages, setMessage] = useState<string[]>([]);

  const onClick = () => {
    const msg = createMsg("World!");
    setMessage([...messages, msg]);
  };

  return (
    <div className={style.App}>
      <div className={style.container}>
        <img className={style.img} src="./giz.png" alt="Gizual Logo" />
        <h1 className={style.h1}>Gizual</h1>
        <p className={style.p}>Welcome to Gizual!</p>
        <div className={style.card}>
          <Button variant="filled" onClick={onClick} className={style.button}>
            Test WASM
          </Button>
          {messages.map((m) => {
            return <p className="text-center">{m}</p>;
          })}
        </div>
        <Button
          variant="filled"
          color="gizgunmetal"
          onClick={() => console.log("Not implemented")}
          className={style.button}
        >
          {"Skip to main"}
        </Button>
      </div>
    </div>
  );
}

export default App;

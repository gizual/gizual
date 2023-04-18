import { useState } from "react";

import style from "./app.module.scss";
import WelcomePage from "./pages/welcome";
import MainPage from "./pages/main";

function App() {
  const [page, setPage] = useState(1);
  const isWelcomePage = page === 0;
  const isMainPage = page === 1;

  return (
    <div className={style.App}>
      {isWelcomePage && (
        <WelcomePage
          cb={() => {
            console.log("HELLO");
            setPage(1);
          }}
        />
      )}
      {isMainPage && <MainPage />}
    </div>
  );
}

export default App;

import { useState } from "react";

import style from "./app.module.scss";
import MainPage from "./pages/main";
import WelcomePage from "./pages/welcome";

function App() {
  const [page, setPage] = useState(0);
  const isWelcomePage = page === 0;
  const isMainPage = page === 1;

  return (
    <div className={style.App}>
      {isWelcomePage && (
        <WelcomePage
          cb={() => {
            setPage(1);
          }}
        />
      )}
      {isMainPage && <MainPage />}
    </div>
  );
}

export default App;

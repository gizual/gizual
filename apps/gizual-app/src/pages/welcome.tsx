import baseStyle from "../app.module.scss";
import { Button } from "../primitives";

import { useMainController } from "../controllers";

interface WelcomePageProps {
  cb: () => void;
}

function WelcomePage(props: WelcomePageProps) {
  const mainController = useMainController();
  const openPicker = () => {
    window.showDirectoryPicker();
  };

  return (
    <div className={baseStyle.App}>
      <div className={baseStyle.container}>
        <img className={baseStyle.img} src="./giz.png" alt="Gizual Logo" />
        <h1 className={baseStyle.h1}>Gizual</h1>
        <p className={baseStyle.p}>Welcome to Gizual!</p>
        <div className={baseStyle.card}>
          <Button variant="filled" onClick={openPicker} className={baseStyle.button}>
            Load Repository
          </Button>
        </div>
        <Button variant="filled" color="gunmetal" onClick={props.cb} className={baseStyle.button}>
          {"MOCK --> Skip to main"}
        </Button>
      </div>
    </div>
  );
}

export default WelcomePage;

import { useCallback } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { LS_FEEDBACK } from "../../constants";
import Game from "../../components/Game/Game";
import classes from "./GamePage.module.css";

const GamePage: FC = () => {
  const navigate = useNavigate();
  const goHome = useCallback(() => navigate("/"), [navigate]);
  const feedback = localStorage.getItem(LS_FEEDBACK) !== "off";

  return (
    <div className={classes["page"]}>
      <Game autoStart={true} onGameEnd={goHome} feedback={feedback} />
    </div>
  );
};

export default GamePage;

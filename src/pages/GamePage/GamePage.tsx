import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Game from "../../components/Game/Game";
import classes from "./GamePage.module.css";

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const goHome = useCallback(() => navigate("/"), [navigate]);
  const feedback = localStorage.getItem("feedback") !== "off";

  return (
    <div className={classes["page"]}>
      <Game autoStart={true} onGameEnd={goHome} feedback={feedback} />
    </div>
  );
};

export default GamePage;

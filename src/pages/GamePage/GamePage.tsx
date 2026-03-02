import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Game from "../../components/Game/Game";
import classes from "./GamePage.module.css";

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const goHome = useCallback(() => navigate("/"), [navigate]);

  return (
    <div className={classes["page"]}>
      <Game autoStart={true} onGameEnd={goHome} />
    </div>
  );
};

export default GamePage;

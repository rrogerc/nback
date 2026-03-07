import React, { useState, useEffect, useRef, useCallback } from "react";

import classes from "./Game.module.css";

import Board from "./Board/Board";
import Score from "./Score/Score";

const Game: React.FC<{
  autoStart?: boolean;
  onGameEnd?: () => void;
}> = ({ autoStart = false, onGameEnd }) => {
  const [game, setGame] = useState<{
    active: boolean;
    task: number;
    trials: number;
  }>({
    active: false,
    task: Number(localStorage.getItem("task")) || 2,
    trials: Number(localStorage.getItem("trials")) || 40,
  });

  const [score, setScore] = useState<{
    nback: number;
    trials: number;
    spatialScore: number;
    auditoryScore: number;
    totalScore: number;
    speed: number;
    elapsedTime: number;
    spatialObj: {
      TP: number;
      TN: number;
      FP: number;
      FN: number;
    };
    auditoryObj: {
      TP: number;
      TN: number;
      FP: number;
      FN: number;
    };
  }>({
    nback: 0,
    trials: 0,
    spatialScore: 0,
    auditoryScore: 0,
    totalScore: 0,
    speed: 0,
    elapsedTime: 0,
    spatialObj: {
      TP: 0,
      TN: 0,
      FP: 0,
      FN: 0,
    },
    auditoryObj: {
      TP: 0,
      TN: 0,
      FP: 0,
      FN: 0,
    },
  });

  // Auto-start on mount
  const hasStarted = useRef(false);
  useEffect(() => {
    if (autoStart && !hasStarted.current) {
      hasStarted.current = true;
      setGame((prev) => ({ ...prev, active: true }));
    }
  }, [autoStart]);

  // Escape to go home on results screen
  const showingResults = !game.active && score.trials > 0;
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && onGameEnd) onGameEnd();
    },
    [onGameEnd]
  );
  useEffect(() => {
    if (!showingResults) return;
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showingResults, handleEscape]);

  return (
    <main id="game" className={classes["game"]}>
      {game.active ? (
        <Board
          game={game}
          setGame={setGame}
          setScore={setScore}
          onQuit={onGameEnd}
          liveScore={score}
        />
      ) : (
        <div className={classes["results"]}>
          {score.trials > 0 && (
            <>
              <div className={classes["headline"]}>
                <span className={classes["headline-score"]}>
                  {score.totalScore}%
                </span>
                <span className={classes["headline-label"]}>
                  {score.nback}-Back Score
                </span>
              </div>
              <Score score={score} />
              {onGameEnd && (
                <button className={classes["return"]} onClick={onGameEnd}>
                  Return Home
                </button>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
};

export default Game;

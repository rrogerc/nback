import { useState, useEffect, useRef, useCallback } from "react";
import type { FC } from "react";
import type { GameState, ScoreState } from "../../types";
import { DEFAULT_TASK, DEFAULT_TRIALS, LS_TASK, LS_TRIALS, SPEED } from "../../constants";

import classes from "./Game.module.css";

import Board from "./Board/Board";
import Score from "./Score/Score";

const Game: FC<{
  autoStart?: boolean;
  onGameEnd?: () => void;
  feedback?: boolean;
}> = ({ autoStart = false, onGameEnd, feedback = true }) => {
  const [game, setGame] = useState<GameState>({
    active: false,
    task: Number(localStorage.getItem(LS_TASK)) || DEFAULT_TASK,
    trials: Number(localStorage.getItem(LS_TRIALS)) || DEFAULT_TRIALS,
  });

  const [score, setScore] = useState<ScoreState>({
    trials: 0,
    spatialScore: 0,
    auditoryScore: 0,
    elapsedTime: 0,
    spatialObj: { TP: 0, TN: 0, FP: 0, FN: 0 },
    auditoryObj: { TP: 0, TN: 0, FP: 0, FN: 0 },
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
          feedback={feedback}
        />
      ) : (
        <div className={classes["results"]}>
          {score.trials > 0 && (
            <>
              <div className={classes["headline"]}>
                <span className={classes["headline-score"]}>
                  {((score.spatialScore + score.auditoryScore) / 2).toFixed(2)}%
                </span>
                <span className={classes["headline-label"]}>
                  {game.task}-Back Score
                </span>
              </div>
              <Score score={score} nback={game.task} speed={SPEED / 1000} />
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

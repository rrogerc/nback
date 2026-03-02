import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
} from "react";

import classes from "./Task.module.css";

const Task: React.FC<{
  activeGame: boolean;
  task: number;
  setGame: Dispatch<
    SetStateAction<{
      active: boolean;
      task: number;
      trials: number;
    }>
  >;
}> = ({ activeGame, task, setGame }) => {
  const [startPressed, setStartPressed] = useState<boolean>(false);

  const toggleGame = useCallback(() => {
    if (!activeGame)
      setGame((prevGame) => {
        return {
          ...prevGame,
          active: true,
        };
      });
    else
      setGame((prevGame) => {
        return {
          ...prevGame,
          active: false,
        };
      });
  }, [activeGame, setGame]);

  const upTask = (e: React.MouseEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.borderBottomColor = "var(--main-bg-color)";
    if (!activeGame)
      setGame((prevGame) => {
        const newState = {
          ...prevGame,
          task: prevGame.task < 99 ? prevGame.task + 1 : 99,
        };

        localStorage.setItem("task", String(newState.task));
        return newState;
      });
  };

  const downTask = (e: React.MouseEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.borderTopColor = "var(--main-bg-color)";
    if (!activeGame)
      setGame((prevGame) => {
        const newState = {
          ...prevGame,
          task: prevGame.task > 1 ? prevGame.task - 1 : 1,
        };

        localStorage.setItem("task", String(newState.task));
        return newState;
      });
  };

  const arrowMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.borderBottomColor = "var(--main-color)";
    (e.target as HTMLElement).style.borderTopColor = "var(--main-color)";
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.type === "keypress" && e.code === "KeyS") {
        setStartPressed(true);
        toggleGame();
      } else if (e.type === "keyup" && e.code === "KeyS")
        setStartPressed(false);
    };

    window.addEventListener("keypress", keyHandler);
    window.addEventListener("keyup", keyHandler);

    return () => {
      window.removeEventListener("keypress", keyHandler);
      window.removeEventListener("keyup", keyHandler);
    };
  }, [toggleGame]);

  return (
    <div className={classes["task"]}>
      <div className={classes["arrows-task"]}>
        <div
          className={classes["up"]}
          onMouseDown={upTask}
          onMouseUp={arrowMouseUp}
        ></div>
        <div
          className={classes["down"]}
          onMouseDown={downTask}
          onMouseUp={arrowMouseUp}
        ></div>
      </div>
      <h2 className="mini-title">
        <span>{task}</span>
        <span className="yellow">-</span>Back
      </h2>
      <div className={classes["play"]}>
        <button
          id="KeyS"
          onClick={toggleGame}
          onMouseDown={() => setStartPressed(true)}
          onMouseUp={() => setStartPressed(false)}
          className={startPressed ? "button-active" : ""}
        >
          KeyS: {activeGame ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
};

export default Task;

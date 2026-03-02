import React, { Dispatch, SetStateAction } from "react";

import classes from "./Trials.module.css";
import Clock from "./Clock/Clock";

const Trials: React.FC<{
  activeGame: boolean;
  trials: number;
  trialsCounter: number;
  elapsedTime: number;
  speed: number;
  setGame: Dispatch<
    SetStateAction<{
      active: boolean;
      task: number;
      trials: number;
    }>
  >;
}> = (props) => {
  const changeTrialsHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enteredTrials = +e.currentTarget.value;

    props.setGame((prevGame) => {
      return {
        ...prevGame,
        trials:
          enteredTrials > 999
            ? 999
            : enteredTrials < 1
            ? 1
            : enteredTrials,
      };
    });

    localStorage.setItem("trials", String(enteredTrials));
  };

  return (
    <div className={classes["game"]}>
      <Clock
        activeGame={props.activeGame}
        elapsedTime={props.elapsedTime}
        speed={props.speed}
      />
      <div className={classes["trials-counter"]}>
        <span
          className={
            props.activeGame ? classes["green-dot"] : classes["red-dot"]
          }
        ></span>
        <form action="#">
          <label htmlFor="trials-input" className={classes["trials"]}>
            {props.trialsCounter} /&nbsp;
          </label>
          <input
            onChange={changeTrialsHandler}
            type="number"
            id="trials-input"
            name="quantity"
            min="1"
            max="999"
            value={props.trials}
            className={classes["input"]}
            disabled={props.activeGame ? true : false}
          />
        </form>
      </div>
    </div>
  );
};

export default Trials;

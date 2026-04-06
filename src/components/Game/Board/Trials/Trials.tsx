import type { FC, Dispatch, SetStateAction, ChangeEvent } from "react";
import type { GameState } from "../../../../types";
import { MIN_TRIALS, MAX_TRIALS, LS_TRIALS } from "../../../../constants";

import classes from "./Trials.module.css";
import Clock from "./Clock/Clock";

const Trials: FC<{
  activeGame: boolean;
  paused: boolean;
  trials: number;
  trialsCounter: number;
  elapsedTime: number;
  speed: number;
  setGame: Dispatch<SetStateAction<GameState>>;
}> = (props) => {
  const changeTrialsHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const enteredTrials = +e.currentTarget.value;

    props.setGame((prevGame) => {
      return {
        ...prevGame,
        trials:
          enteredTrials > MAX_TRIALS
            ? MAX_TRIALS
            : enteredTrials < MIN_TRIALS
            ? MIN_TRIALS
            : enteredTrials,
      };
    });

    localStorage.setItem(LS_TRIALS, String(enteredTrials));
  };

  return (
    <div className={classes["game"]}>
      <Clock
        activeGame={props.activeGame}
        paused={props.paused}
        elapsedTime={props.elapsedTime}
        speed={props.speed}
        trialsCounter={props.trialsCounter}
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
            min={MIN_TRIALS}
            max={MAX_TRIALS}
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

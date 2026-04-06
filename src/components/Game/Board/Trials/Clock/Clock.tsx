import type { FC } from "react";
import { formatElapsedTime } from "../../../../../utils/utils";

import classes from "./Clock.module.css";

const Clock: FC<{
  activeGame: boolean;
  paused: boolean;
  elapsedTime: number;
  speed: number;
  trialsCounter: number;
}> = ({ activeGame, paused, elapsedTime, speed, trialsCounter }) => {
  return (
    <div className={classes["speed"]}>
      <div className={classes["clock"]}>
        <div
          key={trialsCounter}
          className={`${classes["hour"]} ${
            activeGame ? classes["hour-spin"] : ""
          }`}
          style={{
            animationDuration: `${speed / 1000}s`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          <div className={classes["white"]}></div>
          <div className={classes["dark"]}></div>
        </div>
      </div>
      <div className={classes["timer"]}>{formatElapsedTime(elapsedTime)}</div>
    </div>
  );
};

export default Clock;

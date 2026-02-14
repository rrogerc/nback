import React from "react";

import classes from "./Clock.module.css";

const Clock: React.FC<{
  activeGame: boolean;
  elapsedTime: number;
  speed: number;
}> = ({ activeGame, elapsedTime, speed }) => {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className={classes["speed"]}>
      <div className={classes["clock"]}>
        <div
          className={`${classes["hour"]} ${
            activeGame ? classes["hour-spin"] : ""
          }`}
          style={{ animationDuration: `${speed / 1000}s` }}
        >
          <div className={classes["white"]}></div>
          <div className={classes["dark"]}></div>
        </div>
      </div>
      <div className={classes["timer"]}>{formatTime(elapsedTime)}</div>
    </div>
  );
};

export default Clock;

import React from "react";

import classes from "./Clock.module.css";

const Clock: React.FC<{
  activeGame: boolean;
  paused: boolean;
  elapsedTime: number;
  speed: number;
  trialsCounter: number;
}> = ({ activeGame, paused, elapsedTime, speed, trialsCounter }) => {
  const formatTime = (ms: number) => {
    const totalMs = ms % 1000;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(
      totalMs
    ).padStart(3, "0")}`;
  };

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
      <div className={classes["timer"]}>{formatTime(elapsedTime)}</div>
    </div>
  );
};

export default Clock;

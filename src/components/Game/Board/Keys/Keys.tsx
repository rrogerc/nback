import type { FC } from "react";

import classes from "./Keys.module.css";

const Keys: FC<{
  activeGame: boolean;
  spatialPressed: boolean;
  spatialMatch: boolean;
  auditoryPressed: boolean;
  auditoryMatch: boolean;
  feedback: boolean;
}> = (props) => {
  const pressedClass = (match: boolean) =>
    !props.activeGame
      ? "button-active"
      : !props.feedback
      ? classes["blue"]
      : match
      ? classes["green"]
      : classes["red"];

  return (
    <div className={classes["keys"]}>
      <button
        id="KeyA"
        className={
          props.spatialPressed
            ? pressedClass(props.spatialMatch)
            : classes["transparent"]
        }
      >
        Position
      </button>
      <button
        id="KeyL"
        className={
          props.auditoryPressed
            ? pressedClass(props.auditoryMatch)
            : classes["transparent"]
        }
      >
        Sound
      </button>
    </div>
  );
};

export default Keys;

import React from "react";

import classes from "./Keys.module.css";

const Keys: React.FC<{
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
        KeyA: Spatial
      </button>
      <button
        id="KeyL"
        className={
          props.auditoryPressed
            ? pressedClass(props.auditoryMatch)
            : classes["transparent"]
        }
      >
        KeyL: Auditory
      </button>
    </div>
  );
};

export default Keys;

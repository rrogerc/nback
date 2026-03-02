import React from "react";

import classes from "./Keys.module.css";

const Keys: React.FC<{
  activeGame: boolean;
  spatialPressed: boolean;
  spatialMatch: boolean;
  auditoryPressed: boolean;
  auditoryMatch: boolean;
}> = (props) => {
  return (
    <div className={classes["keys"]}>
      <button
        id="KeyA"
        className={
          props.spatialPressed
            ? !props.activeGame
              ? "button-active"
              : props.spatialMatch
              ? classes["green"]
              : classes["red"]
            : classes["transparent"]
        }
      >
        KeyA: Spatial
      </button>
      <button
        id="KeyL"
        className={
          props.auditoryPressed
            ? !props.activeGame
              ? "button-active"
              : props.auditoryMatch
              ? classes["green"]
              : classes["red"]
            : classes["transparent"]
        }
      >
        KeyL: Auditory
      </button>
    </div>
  );
};

export default Keys;

import React from "react";

import classes from "./Title.module.css";

const Title: React.FC = () => {
  return (
    <div>
      <button className={classes["h1-desktop"]}>
        Dual&nbsp;N<span className="yellow">-</span>Back
      </button>
      <button className={classes["h1-mobile"]}>
        D&nbsp;N<span className="yellow">-</span>B
      </button>
    </div>
  );
};

export default Title;

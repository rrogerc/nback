import React from "react";

import classes from "./Copyright.module.css";

const Copyright: React.FC = () => {
  return (
    <div className={classes["copyright"]}>
      <p className="copyR">
        Copyright &copy;&nbsp;
        <span>2021</span>
        <span className="yellow">-</span>
        <span className="year">2026</span>, NBacking. All&nbsp;
        <a
          target="_blank"
          rel="noreferrer"
          href="https://scratch.mit.edu/projects/387535576/"
        >
          Rights
        </a>
        &nbsp;Reserved. Powered by&nbsp;
        <a
          target="_blank"
          rel="noreferrer"
          href="https://m.youtube.com/FranklinYulian"
        >
          FY
        </a>
        .
      </p>
    </div>
  );
};

export default Copyright;

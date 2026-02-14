import React from "react";
import classes from "./Header.module.css";

import Switch from "./Switch/Switch";
import Title from "./Title/Title";

const Header: React.FC = () => {
  return (
    <header className={classes["header"]}>
      <Switch />
      <Title />
    </header>
  );
};

export default Header;

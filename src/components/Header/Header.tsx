import React from "react";
import classes from "./Header.module.css";

import Switch from "./Switch/Switch";

const Header: React.FC = () => {
  return (
    <header className={classes["header"]}>
      <Switch />
    </header>
  );
};

export default Header;

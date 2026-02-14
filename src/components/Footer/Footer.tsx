import React from "react";

import classes from "./Footer.module.css";

import Donate from "./Donate/Donate";
import Copyright from "./Copyright/Copyright";
import Social from "./Social/Social";

const Footer: React.FC = () => {
  return (
    <div className={classes["footer"]}>
      <Donate />
      <Copyright />
      <Social />
    </div>
  );
};

export default Footer;

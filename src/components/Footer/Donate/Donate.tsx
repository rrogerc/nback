import React from "react";
import classes from "./Donate.module.css";

const Donate: React.FC = () => {
  return (
    <div className={classes["donate"]}>
      <form
        action="https://www.paypal.com/donate"
        method="post"
        target="_blank"
      >
        <input type="hidden" name="hosted_button_id" value="P9NTAKLCA6ZLW" />
        <img alt="" src="" width="1" height="1" />
        <button type="submit">
          Donate <span className="yellow">&hearts;</span>
        </button>
      </form>
    </div>
  );
};

export default Donate;

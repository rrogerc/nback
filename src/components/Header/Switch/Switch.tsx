import React, { useState } from "react";
import classes from "./Switch.module.css";

type Theme = "system" | "light" | "dark";

const Switch: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  });

  const apply = (t: Theme) => {
    setTheme(t);
    if (t === "system") {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem("theme");
    } else {
      document.documentElement.dataset.theme = t;
      localStorage.setItem("theme", t);
    }
  };

  return (
    <div className={classes["picker"]}>
      {(["system", "light", "dark"] as Theme[]).map((t) => (
        <button
          key={t}
          className={`${classes["option"]} ${theme === t ? classes["active"] : ""}`}
          onClick={() => apply(t)}
        >
          {t === "system" ? "Auto" : t === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
};

export default Switch;

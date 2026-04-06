import { useState } from "react";
import type { FC } from "react";
import { LS_THEME } from "../../../constants";
import classes from "./Switch.module.css";

type Theme = "system" | "light" | "dark";

const Switch: FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(LS_THEME);
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  });

  const apply = (t: Theme) => {
    setTheme(t);
    if (t === "system") {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem(LS_THEME);
    } else {
      document.documentElement.dataset.theme = t;
      localStorage.setItem(LS_THEME, t);
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

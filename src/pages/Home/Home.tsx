import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Switch from "../../components/Header/Switch/Switch";
import classes from "./Home.module.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState(
    Number(localStorage.getItem("task")) || 2
  );
  const [trials, setTrials] = useState<number | string>(
    Number(localStorage.getItem("trials")) || 40
  );

  const upTask = () => {
    setTask((prev) => {
      const next = prev < 99 ? prev + 1 : 99;
      localStorage.setItem("task", String(next));
      return next;
    });
  };

  const downTask = () => {
    setTask((prev) => {
      const next = prev > 1 ? prev - 1 : 1;
      localStorage.setItem("task", String(next));
      return next;
    });
  };

  const changeTrials = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    if (raw === "") {
      setTrials("");
      return;
    }
    const val = +raw;
    const clamped = val > 999 ? 999 : val;
    setTrials(clamped);
    localStorage.setItem("trials", String(clamped));
  };

  const blurTrials = () => {
    const val = Number(trials);
    const clamped = val < 1 || isNaN(val) ? 1 : val;
    setTrials(clamped);
    localStorage.setItem("trials", String(clamped));
  };

  const startGame = useCallback(() => {
    // Unlock audio context on iOS (must happen in user gesture call stack)
    const a = new Audio();
    a.play().catch(() => {});
    a.pause();
    navigate("/game");
  }, [navigate]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === "KeyS" && e.type === "keypress") {
        startGame();
      }
    };
    window.addEventListener("keypress", keyHandler);
    return () => window.removeEventListener("keypress", keyHandler);
  }, [startGame]);

  return (
    <main className={classes["home"]}>
      <h1 className={classes["title"]}>
        Dual <span className="yellow">N</span>-Back
      </h1>

      <div className={classes["settings"]}>
        <div className={classes["setting"]}>
          <label className={classes["label"]}>N-Back Level</label>
          <div className={classes["selector"]}>
            <div className={classes["down"]} onClick={downTask}></div>
            <span className={classes["value"]}>{task}</span>
            <div className={classes["up"]} onClick={upTask}></div>
          </div>
        </div>

        <div className={classes["setting"]}>
          <label className={classes["label"]}>Trials</label>
          <input
            type="number"
            min="1"
            max="999"
            value={trials}
            onChange={changeTrials}
            onBlur={blurTrials}
            className={classes["input"]}
          />
        </div>
      </div>

      <button className={classes["start"]} onClick={startGame}>
        Start
      </button>

      <div className={classes["theme"]}>
        <Switch />
      </div>
    </main>
  );
};

export default Home;

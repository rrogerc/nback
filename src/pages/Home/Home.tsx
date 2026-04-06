import { useState, useEffect, useCallback } from "react";
import type { FC, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_TASK, DEFAULT_TRIALS, MIN_TASK, MAX_TASK, MIN_TRIALS, MAX_TRIALS, LS_TASK, LS_TRIALS, LS_FEEDBACK, KEY_START } from "../../constants";
import Switch from "../../components/Header/Switch/Switch";
import classes from "./Home.module.css";

const Home: FC = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState(
    Number(localStorage.getItem(LS_TASK)) || DEFAULT_TASK
  );
  const [trials, setTrials] = useState<number | string>(
    Number(localStorage.getItem(LS_TRIALS)) || DEFAULT_TRIALS
  );
  const [feedback, setFeedback] = useState(
    localStorage.getItem(LS_FEEDBACK) !== "off"
  );

  const upTask = () => {
    setTask((prev) => {
      const next = prev < MAX_TASK ? prev + 1 : MAX_TASK;
      localStorage.setItem(LS_TASK, String(next));
      return next;
    });
  };

  const downTask = () => {
    setTask((prev) => {
      const next = prev > MIN_TASK ? prev - 1 : MIN_TASK;
      localStorage.setItem(LS_TASK, String(next));
      return next;
    });
  };

  const changeTrials = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    if (raw === "") {
      setTrials("");
      return;
    }
    const val = +raw;
    const clamped = val > MAX_TRIALS ? MAX_TRIALS : val;
    setTrials(clamped);
    localStorage.setItem(LS_TRIALS, String(clamped));
  };

  const blurTrials = () => {
    const val = Number(trials);
    const clamped = val < MIN_TRIALS || isNaN(val) ? MIN_TRIALS : val;
    setTrials(clamped);
    localStorage.setItem(LS_TRIALS, String(clamped));
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
      if (e.code === KEY_START && e.type === "keypress") {
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
            min={MIN_TRIALS}
            max={MAX_TRIALS}
            value={trials}
            onChange={changeTrials}
            onBlur={blurTrials}
            className={classes["input"]}
          />
        </div>

        <div className={classes["setting"]}>
          <label className={classes["label"]}>Feedback</label>
          <button
            className={`${classes["toggle"]} ${feedback ? classes["toggle-on"] : classes["toggle-off"]}`}
            onClick={() => {
              setFeedback((prev) => {
                const next = !prev;
                localStorage.setItem(LS_FEEDBACK, next ? "on" : "off");
                return next;
              });
            }}
          >
            {feedback ? "On" : "Off"}
          </button>
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

import React, {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";

import h from "../../../assets/sounds/h.wav";
import j from "../../../assets/sounds/j.wav";
import k from "../../../assets/sounds/k.wav";
import l from "../../../assets/sounds/l.wav";
import q from "../../../assets/sounds/q.wav";
import r from "../../../assets/sounds/r.wav";
import s from "../../../assets/sounds/s.wav";
import t from "../../../assets/sounds/t.wav";

import Trials from "./Trials/Trials";
import Panel from "./Panel/Panel";
import Keys from "./Keys/Keys";
import { getScore, randomInt } from "../../../utils/utils";

import classes from "./Board.module.css";

const SPEED = 3000; // ms per interval

const Board: React.FC<{
  game: {
    active: boolean;
    task: number;
    trials: number;
  };
  setGame: Dispatch<
    SetStateAction<{
      active: boolean;
      task: number;
      trials: number;
    }>
  >;
  setScore: Dispatch<
    SetStateAction<{
      nback: number;
      trials: number;
      spatialScore: number;
      auditoryScore: number;
      totalScore: number;
      speed: number;
      elapsedTime: number;
      spatialObj: {
        TP: number;
        TN: number;
        FP: number;
        FN: number;
      };
      auditoryObj: {
        TP: number;
        TN: number;
        FP: number;
        FN: number;
      };
    }>
  >;
  onQuit?: () => void;
}> = ({ game, setGame, setScore, onQuit }) => {
  const sounds: {
    [key: number]: HTMLAudioElement;
  } = useMemo(() => {
    return {
      1: new Audio(h),
      2: new Audio(j),
      3: new Audio(k),
      4: new Audio(l),
      5: new Audio(q),
      6: new Audio(r),
      7: new Audio(s),
      8: new Audio(t),
    };
  }, []);

  const [spatialPlace, setSpatialPlace] = useState<number>(0);
  const [spatialPressed, setSpatialPressed] = useState<boolean>(false);
  const [spatialMatch, setSpatialMatch] = useState<boolean>(false);

  const [auditoryPressed, setAuditoryPressed] = useState<boolean>(false);
  const [auditoryMatch, setAuditoryMatch] = useState<boolean>(false);

  const [trialsCounter, setTrialsCounter] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);

  // --- Pause/resume timing refs ---
  const pausedRef = useRef(false);
  // setTimeout IDs (not setInterval — gives us exact control)
  const tickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spatialHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamps for computing remaining time on pause
  const nextTickAtRef = useRef(0);     // absolute time the next tick should fire
  const spatialHideAtRef = useRef(0);  // absolute time the spatial stimulus should hide
  // Elapsed-time bookkeeping
  const gameStartRef = useRef(0);
  const totalPausedRef = useRef(0);
  const pauseStartRef = useRef(0);
  // Tick function ref so togglePause can schedule it
  const tickRef = useRef<(() => void) | null>(null);
  // Helper to schedule next tick
  const scheduleTickRef = useRef<((delay: number) => void) | null>(null);

  // Helpers to start/stop the 100ms elapsed-time updater
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) return; // already running
    timerIntervalRef.current = setInterval(() => {
      const el = Date.now() - gameStartRef.current - totalPausedRef.current;
      setElapsedTime(el);
      setScore((prev) => ({ ...prev, elapsedTime: el }));
    }, 100);
  }, [setScore]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    if (!game.active) return;
    const now = Date.now();

    if (!pausedRef.current) {
      // === PAUSE ===
      pausedRef.current = true;
      setPaused(true);
      pauseStartRef.current = now;

      // Kill the pending next-tick timeout
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
        tickTimeoutRef.current = null;
      }

      // Kill the spatial-hide timeout
      if (spatialHideRef.current) {
        clearTimeout(spatialHideRef.current);
        spatialHideRef.current = null;
        // spatialHideAtRef still holds the original target time
      }

      // Stop elapsed-time updater
      stopTimer();
    } else {
      // === RESUME ===
      pausedRef.current = false;
      setPaused(false);
      totalPausedRef.current += now - pauseStartRef.current;

      // Restart elapsed-time updater
      startTimer();

      // If spatial stimulus was still showing when we paused, resume its hide timeout
      if (spatialHideAtRef.current > 0) {
        const hideRemaining = Math.max(0, spatialHideAtRef.current - pauseStartRef.current);
        if (hideRemaining > 0) {
          spatialHideRef.current = setTimeout(() => {
            setSpatialPlace(0);
            spatialHideRef.current = null;
            spatialHideAtRef.current = 0;
          }, hideRemaining);
        } else {
          setSpatialPlace(0);
          spatialHideAtRef.current = 0;
        }
      }

      // Resume the game tick with the time that was remaining
      const tickRemaining = Math.max(0, nextTickAtRef.current - pauseStartRef.current);
      if (scheduleTickRef.current) {
        scheduleTickRef.current(tickRemaining);
      }
    }
  }, [game.active, startTimer, stopTimer]);

  useEffect(() => {
    let trialsCounterInterval: number = 0;

    let spatialInput: boolean = false;
    let spatialMatchInterval: boolean = false;
    const spatialArr: number[] = [];
    const spatialObj = { TP: 0, TN: 0, FP: 0, FN: 0 };

    let auditoryInput: boolean = false;
    let auditoryMatchInterval: boolean = false;
    const auditoryArr: number[] = [];
    const auditoryObj = { TP: 0, TN: 0, FP: 0, FN: 0 };

    const stopGame = (
      trials: number,
      sObj: { TP: number; TN: number; FP: number; FN: number },
      aObj: { TP: number; TN: number; FP: number; FN: number }
    ) => {
      setTrialsCounter(0);
      const finalElapsed =
        Date.now() - gameStartRef.current - totalPausedRef.current;
      setElapsedTime(0);
      stopTimer();

      const spatialScore = getScore(sObj.TP, sObj.FP, sObj.FN);
      const auditoryScore = getScore(aObj.TP, aObj.FP, aObj.FN);

      setScore({
        nback: game.task,
        trials,
        spatialScore,
        auditoryScore,
        totalScore: Number(((spatialScore + auditoryScore) / 2).toFixed(2)),
        speed: SPEED / 1000,
        elapsedTime: finalElapsed,
        spatialObj: sObj,
        auditoryObj: aObj,
      });

      setGame((prevGame) => ({ ...prevGame, active: false }));
    };

    const eventHandler = (type: string, code: string, button: number) => {
      if (pausedRef.current) return;

      if (type === "keypress" || type === "mousedown") {
        if (code === "KeyA" || (button === 0 && code === "game")) {
          if (game.active) spatialInput = true;
          setSpatialPressed(true);
        }
        if (code === "KeyL" || (button === 2 && code === "game")) {
          if (game.active) auditoryInput = true;
          setAuditoryPressed(true);
        }
      } else if (type === "keyup" || type === "mouseup") {
        if (code === "KeyA" || (button === 0 && code === "game"))
          setSpatialPressed(false);
        if (code === "KeyL" || (button === 2 && code === "game"))
          setAuditoryPressed(false);
      }
    };

    const keyHandler = (e: KeyboardEvent) =>
      eventHandler(e.type, e.code, -1);

    const clickHandler = (e: MouseEvent) =>
      eventHandler(
        e.type,
        (e.target as HTMLInputElement).id
          ? (e.target as HTMLInputElement).id
          : (e.target as HTMLInputElement).parentElement!.id
            ? (e.target as HTMLInputElement).parentElement!.id
            : (e.target as HTMLInputElement).parentElement!.parentElement!.id,
        e.button
      );

    const updateScore = (
      match: boolean,
      input: boolean,
      obj: { TP: number; TN: number; FP: number; FN: number }
    ) => {
      if (match && input) obj.TP++;
      else if (match && !input) obj.FN++;
      else if (!match && input) obj.FP++;
      else if (!match && !input) obj.TN++;
    };

    // --- setTimeout-chain game loop ---
    const scheduleTick = (delay: number) => {
      const now = Date.now();
      nextTickAtRef.current = now + delay;
      tickTimeoutRef.current = setTimeout(() => {
        tickTimeoutRef.current = null;
        if (!pausedRef.current) tick();
      }, delay);
    };

    const tick = () => {
      if (trialsCounterInterval > 0) {
        updateScore(spatialMatchInterval, spatialInput, spatialObj);
        updateScore(auditoryMatchInterval, auditoryInput, auditoryObj);

        const liveSpatial = getScore(spatialObj.TP, spatialObj.FP, spatialObj.FN);
        const liveAuditory = getScore(auditoryObj.TP, auditoryObj.FP, auditoryObj.FN);
        setScore({
          nback: game.task,
          trials: trialsCounterInterval,
          spatialScore: liveSpatial,
          auditoryScore: liveAuditory,
          totalScore: Number(((liveSpatial + liveAuditory) / 2).toFixed(2)),
          speed: SPEED / 1000,
          elapsedTime:
            Date.now() - gameStartRef.current - totalPausedRef.current,
          spatialObj: { ...spatialObj },
          auditoryObj: { ...auditoryObj },
        });
      }

      [spatialMatchInterval, spatialInput, auditoryMatchInterval, auditoryInput] =
        [false, false, false, false];

      if (trialsCounterInterval >= game.trials) {
        stopGame(trialsCounterInterval, spatialObj, auditoryObj);
        return;
      }

      const spatialRandomPlace = randomInt(1, 8);
      const auditoryRandomPlace = randomInt(1, 8);

      // Show spatial stimulus
      setSpatialPlace(spatialRandomPlace);
      spatialArr.unshift(spatialRandomPlace);

      // Play auditory stimulus
      const sound = sounds[auditoryRandomPlace];
      sound.currentTime = 0;
      sound.play();
      auditoryArr.unshift(auditoryRandomPlace);

      // Check matches
      if (spatialArr.length > game.task) {
        if (spatialArr[0] === spatialArr.slice(-1)[0])
          spatialMatchInterval = true;
        if (auditoryArr[0] === auditoryArr.slice(-1)[0])
          auditoryMatchInterval = true;
        spatialArr.pop();
        auditoryArr.pop();
      }

      setSpatialMatch(spatialMatchInterval);
      setAuditoryMatch(auditoryMatchInterval);

      trialsCounterInterval++;
      setTrialsCounter(trialsCounterInterval);

      // Hide spatial stimulus after half the interval
      const hideTime = Date.now() + SPEED / 2;
      spatialHideAtRef.current = hideTime;
      spatialHideRef.current = setTimeout(() => {
        setSpatialPlace(0);
        spatialHideRef.current = null;
        spatialHideAtRef.current = 0;
      }, SPEED / 2);

      // Schedule next tick
      scheduleTick(SPEED);
    };

    tickRef.current = tick;
    scheduleTickRef.current = scheduleTick;

    if (game.active) {
      pausedRef.current = false;
      setPaused(false);
      totalPausedRef.current = 0;
      gameStartRef.current = Date.now();

      setScore({
        nback: game.task,
        trials: 0,
        spatialScore: 0,
        auditoryScore: 0,
        totalScore: 0,
        speed: SPEED / 1000,
        elapsedTime: 0,
        spatialObj: { TP: 0, TN: 0, FP: 0, FN: 0 },
        auditoryObj: { TP: 0, TN: 0, FP: 0, FN: 0 },
      });

      startTimer();
      // First tick after SPEED ms
      scheduleTick(SPEED);
    }

    window.addEventListener("mousedown", clickHandler);
    window.addEventListener("mouseup", clickHandler);
    window.addEventListener("keypress", keyHandler);
    window.addEventListener("keyup", keyHandler);
    window.addEventListener("contextmenu", (e: MouseEvent) =>
      e.preventDefault()
    );

    return () => {
      window.removeEventListener("mousedown", clickHandler);
      window.removeEventListener("mouseup", clickHandler);
      window.removeEventListener("keypress", keyHandler);
      window.removeEventListener("keyup", keyHandler);
      window.removeEventListener("contextmenu", (e: MouseEvent) =>
        e.preventDefault()
      );

      tickRef.current = null;
      scheduleTickRef.current = null;

      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
        tickTimeoutRef.current = null;
      }
      if (spatialHideRef.current) {
        clearTimeout(spatialHideRef.current);
        spatialHideRef.current = null;
      }
      stopTimer();

      if (game.active) {
        stopGame(trialsCounterInterval, spatialObj, auditoryObj);
      }
    };
  }, [
    game.active,
    game.task,
    game.trials,
    setGame,
    setScore,
    sounds,
    startTimer,
    stopTimer,
  ]);

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") togglePause();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePause]);

  return (
    <div className="game-card">
      {paused && (
        <div className={classes["pause-overlay"]}>
          <div className={classes["pause-modal"]}>
            <h2 className={classes["pause-title"]}>Paused</h2>
            <div className={classes["pause-actions"]}>
              <button
                className={classes["pause-btn-resume"]}
                onClick={togglePause}
              >
                Resume
              </button>
              {onQuit && (
                <button
                  className={classes["pause-btn-quit"]}
                  onClick={onQuit}
                >
                  Quit
                </button>
              )}
            </div>
            <p className={classes["pause-hint"]}>
              Press <kbd>Esc</kbd> to resume
            </p>
          </div>
        </div>
      )}
      <Trials
        activeGame={game.active}
        paused={paused}
        trials={game.trials}
        setGame={setGame}
        trialsCounter={trialsCounter}
        elapsedTime={elapsedTime}
        speed={SPEED}
      />
      {game.active && (
        <button
          className={classes["pause-toggle"]}
          onClick={togglePause}
          title="Pause (Esc)"
        >
          {paused ? "\u25B6" : "\u2759\u2759"}
        </button>
      )}
      <Panel activeGame={game.active} spatialPlace={spatialPlace} />
      <Keys
        activeGame={game.active}
        spatialPressed={spatialPressed}
        spatialMatch={spatialMatch}
        auditoryPressed={auditoryPressed}
        auditoryMatch={auditoryMatch}
      />
    </div>
  );
};

export default Board;

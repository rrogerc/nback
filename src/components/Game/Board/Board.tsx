import {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import type { FC, Dispatch, SetStateAction } from "react";
import type { GameState, ScoreState, ConfusionMatrix } from "../../../types";
import { SPEED, STIMULUS_DURATION, TIMER_INTERVAL, POSITION_COUNT, KEY_SPATIAL, KEY_AUDITORY } from "../../../constants";

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
import { randomInt, updateConfusionMatrix, resolveId, checkNBackMatch, buildScoreState } from "../../../utils/utils";

import classes from "./Board.module.css";

const Board: FC<{
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  setScore: Dispatch<SetStateAction<ScoreState>>;
  onQuit?: () => void;
  liveScore: Pick<ScoreState, "spatialScore" | "auditoryScore">;
  feedback: boolean;
}> = ({ game, setGame, setScore, onQuit, liveScore, feedback }) => {
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
  // Helper to schedule next tick
  const scheduleTickRef = useRef<((delay: number) => void) | null>(null);

  // Helpers to start/stop the 100ms elapsed-time updater
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) return; // already running
    timerIntervalRef.current = setInterval(() => {
      const el = Date.now() - gameStartRef.current - totalPausedRef.current;
      setElapsedTime(el);
      setScore((prev) => ({ ...prev, elapsedTime: el }));
    }, TIMER_INTERVAL);
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
    const spatialObj: ConfusionMatrix = { TP: 0, TN: 0, FP: 0, FN: 0 };

    let auditoryInput: boolean = false;
    let auditoryMatchInterval: boolean = false;
    const auditoryArr: number[] = [];
    const auditoryObj: ConfusionMatrix = { TP: 0, TN: 0, FP: 0, FN: 0 };

    const stopGame = (
      trials: number,
      sObj: ConfusionMatrix,
      aObj: ConfusionMatrix
    ) => {
      setTrialsCounter(0);
      const finalElapsed =
        Date.now() - gameStartRef.current - totalPausedRef.current;
      setElapsedTime(0);
      stopTimer();

      setScore(buildScoreState(trials, sObj, aObj, finalElapsed));

      setGame((prevGame) => ({ ...prevGame, active: false }));
    };

    const eventHandler = (type: string, code: string, button: number) => {
      if (pausedRef.current) return;

      if (type === "keypress" || type === "mousedown") {
        if (code === KEY_SPATIAL || (button === 0 && code === "game")) {
          if (game.active) spatialInput = true;
          setSpatialPressed(true);
        }
        if (code === KEY_AUDITORY || (button === 2 && code === "game")) {
          if (game.active) auditoryInput = true;
          setAuditoryPressed(true);
        }
      }
    };

    const keyHandler = (e: KeyboardEvent) =>
      eventHandler(e.type, e.code, -1);

    const clickHandler = (e: MouseEvent) =>
      eventHandler(e.type, resolveId(e.target as HTMLElement), e.button);

    const touchHandler = (e: TouchEvent) => {
      const id = resolveId(e.target as HTMLElement);
      if (id === KEY_SPATIAL || id === KEY_AUDITORY) {
        e.preventDefault(); // prevent synthetic mousedown firing too
        eventHandler(
          e.type === "touchstart" ? "mousedown" : "mouseup",
          id,
          -1
        );
      }
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
      // Clear button highlights from previous interval
      setSpatialPressed(false);
      setAuditoryPressed(false);

      if (trialsCounterInterval > 0) {
        updateConfusionMatrix(spatialMatchInterval, spatialInput, spatialObj);
        updateConfusionMatrix(auditoryMatchInterval, auditoryInput, auditoryObj);

        setScore(buildScoreState(
          trialsCounterInterval,
          spatialObj,
          auditoryObj,
          Date.now() - gameStartRef.current - totalPausedRef.current
        ));
      }

      [spatialMatchInterval, spatialInput, auditoryMatchInterval, auditoryInput] =
        [false, false, false, false];

      if (trialsCounterInterval >= game.trials) {
        stopGame(trialsCounterInterval, spatialObj, auditoryObj);
        return;
      }

      const spatialRandomPlace = randomInt(1, POSITION_COUNT);
      const auditoryRandomPlace = randomInt(1, POSITION_COUNT);

      // Show spatial stimulus
      setSpatialPlace(spatialRandomPlace);
      spatialArr.unshift(spatialRandomPlace);

      // Play auditory stimulus
      const sound = sounds[auditoryRandomPlace];
      sound.currentTime = 0;
      sound.play().catch(() => {});
      auditoryArr.unshift(auditoryRandomPlace);

      // Check matches
      spatialMatchInterval = checkNBackMatch(spatialArr, game.task);
      auditoryMatchInterval = checkNBackMatch(auditoryArr, game.task);
      if (spatialArr.length > game.task) {
        spatialArr.pop();
        auditoryArr.pop();
      }

      setSpatialMatch(spatialMatchInterval);
      setAuditoryMatch(auditoryMatchInterval);

      trialsCounterInterval++;
      setTrialsCounter(trialsCounterInterval);

      // Hide spatial stimulus after half the interval
      const hideTime = Date.now() + STIMULUS_DURATION;
      spatialHideAtRef.current = hideTime;
      spatialHideRef.current = setTimeout(() => {
        setSpatialPlace(0);
        spatialHideRef.current = null;
        spatialHideAtRef.current = 0;
      }, STIMULUS_DURATION);

      // Schedule next tick
      scheduleTick(SPEED);
    };

    scheduleTickRef.current = scheduleTick;

    if (game.active) {
      pausedRef.current = false;
      setPaused(false);
      totalPausedRef.current = 0;
      gameStartRef.current = Date.now();

      setScore(buildScoreState(0, { TP: 0, TN: 0, FP: 0, FN: 0 }, { TP: 0, TN: 0, FP: 0, FN: 0 }, 0));

      startTimer();
      // First tick after SPEED ms
      scheduleTick(SPEED);
    }

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("mousedown", clickHandler);
    window.addEventListener("mouseup", clickHandler);
    window.addEventListener("touchstart", touchHandler, { passive: false });
    window.addEventListener("touchend", touchHandler);
    window.addEventListener("keypress", keyHandler);
    window.addEventListener("keyup", keyHandler);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("mousedown", clickHandler);
      window.removeEventListener("mouseup", clickHandler);
      window.removeEventListener("touchstart", touchHandler);
      window.removeEventListener("touchend", touchHandler);
      window.removeEventListener("keypress", keyHandler);
      window.removeEventListener("keyup", keyHandler);
      window.removeEventListener("contextmenu", preventContextMenu);

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
    <div className={classes["game-card"]}>
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
        feedback={feedback}
      />
      {trialsCounter > 0 && (
        <div className={classes["live-score"]}>
          <span>
            Spatial <span className="green">{liveScore.spatialScore}%</span>
          </span>
          <span className={classes["live-divider"]}>|</span>
          <span>
            Auditory <span className="green">{liveScore.auditoryScore}%</span>
          </span>
          <span className={classes["live-divider"]}>|</span>
          <span>
            Total <span className="yellow">{((liveScore.spatialScore + liveScore.auditoryScore) / 2).toFixed(2)}%</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Board;

import type { ConfusionMatrix, ScoreState } from "../types";

const getScore = (TP: number, FP: number, FN: number) =>
  Number(
    TP ? ((TP / (TP + FP + FN)) * 100).toFixed(2) : FP || FN ? 0.0 : 100.0
  );

export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const updateConfusionMatrix = (
  match: boolean,
  input: boolean,
  obj: ConfusionMatrix
): void => {
  if (match && input) obj.TP++;
  else if (match && !input) obj.FN++;
  else if (!match && input) obj.FP++;
  else if (!match && !input) obj.TN++;
};

export const resolveId = (el: HTMLElement): string =>
  el.id || el.parentElement?.id || el.parentElement?.parentElement?.id || "";

export const checkNBackMatch = (arr: number[], nback: number): boolean =>
  arr.length > nback && arr[0] === arr[arr.length - 1];

export const buildScoreState = (
  trials: number,
  spatialObj: ConfusionMatrix,
  auditoryObj: ConfusionMatrix,
  elapsedTime: number
): ScoreState => {
  const spatialScore = getScore(spatialObj.TP, spatialObj.FP, spatialObj.FN);
  const auditoryScore = getScore(auditoryObj.TP, auditoryObj.FP, auditoryObj.FN);
  return {
    trials,
    spatialScore,
    auditoryScore,
    elapsedTime,
    spatialObj: { ...spatialObj },
    auditoryObj: { ...auditoryObj },
  };
};

export const formatElapsedTime = (ms: number): string => {
  const totalMs = ms % 1000;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(
    totalMs
  ).padStart(3, "0")}`;
};

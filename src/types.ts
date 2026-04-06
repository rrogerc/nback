export interface GameState {
  active: boolean;
  task: number;
  trials: number;
}

export interface ConfusionMatrix {
  TP: number;
  TN: number;
  FP: number;
  FN: number;
}

export interface ScoreState {
  trials: number;
  spatialScore: number;
  auditoryScore: number;
  elapsedTime: number;
  spatialObj: ConfusionMatrix;
  auditoryObj: ConfusionMatrix;
}

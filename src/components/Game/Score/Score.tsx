import React from "react";

import classes from "./Score.module.css";

const Score: React.FC<{
  score: {
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
  };
}> = ({
  score: {
    nback,
    trials,
    spatialScore,
    auditoryScore,
    totalScore,
    speed,
    elapsedTime,
    spatialObj,
    auditoryObj,
  },
}) => {
  const spatialTrials = spatialObj.TP + spatialObj.FN;
  const auditoryTrials = auditoryObj.TP + auditoryObj.FN;
  const falsePositives = auditoryObj.FP + spatialObj.FP;
  const trueNegatives =
    trials - (spatialTrials + auditoryTrials + falsePositives);

  const formatElapsed = (ms: number) => {
    const totalMs = ms % 1000;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(
      totalMs
    ).padStart(3, "0")}`;
  };

  return (
    <div className={classes["score"]}>
      <header className={classes["header"]}>
        <h2 className="mini-title">
          Stimulus<span className="yellow">-</span>Response
        </h2>
      </header>

      <table className="table">
        <thead>
          <tr>
            <th>
              {nback}<span className="yellow">-</span>Back
            </th>
            <th>Response</th>
            <th>No Response</th>
            <th>Trials</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Spatial</th>
            <td className="green">{spatialObj.TP}</td>
            <td className="red">{spatialObj.FN}</td>
            <td>{spatialTrials}</td>
            <td className="green">{spatialScore}%</td>
          </tr>
          <tr>
            <th>Auditory</th>
            <td className="green">{auditoryObj.TP}</td>
            <td className="red">{auditoryObj.FN}</td>
            <td>{auditoryTrials}</td>
            <td className="green">{auditoryScore}%</td>
          </tr>
          <tr>
            <th>No Stimulus</th>
            <td className="red">{falsePositives}</td>
            <td>{trueNegatives}</td>
            <td>{falsePositives + trueNegatives}</td>
            <td>-</td>
          </tr>
          <tr>
            <th>Total Stimulus</th>
            <td>{spatialObj.TP + auditoryObj.TP + falsePositives}</td>
            <td>{spatialObj.FN + auditoryObj.FN + trueNegatives}</td>
            <td>{trials}</td>
            <td className="yellow">{totalScore}%</td>
          </tr>
        </tbody>
      </table>

      <br />

      <table className="table">
        <thead>
          <tr>
            <th>Speed</th>
            <th>Trials</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{speed}s</td>
            <td>{trials}</td>
            <td className="blue">{formatElapsed(elapsedTime)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Score;

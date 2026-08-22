import { useEffect, useState, type CSSProperties } from "react";
import { getAudioDiag, subscribeAudioDiag } from "../audio";

/**
 * Dev-only on-screen overlay showing what the audio pipeline is actually
 * doing on the device. Remove once iOS audio is sorted out.
 */
export default function AudioDiagnostics() {
  const [, force] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => subscribeAudioDiag(() => force((n) => n + 1)), []);

  const d = getAudioDiag();
  const loadColor =
    d.loadAttempts === 0
      ? "#888"
      : d.loadSuccess === d.loadAttempts
      ? "#22c55e"
      : "#ef4444";
  const playColor =
    d.playAttempts === 0
      ? "#888"
      : d.playStarted === d.playAttempts
      ? "#22c55e"
      : d.playStarted > 0
      ? "#f0b429"
      : "#ef4444";

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{ ...overlayStyle, padding: "0.4rem 0.6rem", fontSize: "1.1rem" }}
      >
        🎚 diag
      </button>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={rowStyle}>
        <strong>audio diag</strong>
        <button
          onClick={() => setCollapsed(true)}
          style={btnStyle}
          aria-label="collapse"
        >
          ×
        </button>
      </div>
      <div>
        ctx: <span style={{ color: stateColor(d.ctxState) }}>{d.ctxState}</span>
        {d.sampleRate ? ` @ ${d.sampleRate}` : ""}
      </div>
      <div>unlock: {d.unlockCalled ? "yes" : "no"} · resume×{d.resumeCalls}</div>
      <div>
        load: <span style={{ color: loadColor }}>{d.loadSuccess}/{d.loadAttempts}</span>
      </div>
      {d.loadErrors.length > 0 && (
        <div style={errStyle}>load err: {d.loadErrors[0]}</div>
      )}
      <div>
        play:{" "}
        <span style={{ color: playColor }}>
          {d.playStarted}/{d.playAttempts}
        </span>{" "}
        skip {d.playSkipped}
      </div>
      {d.playLastError && <div style={errStyle}>play err: {d.playLastError}</div>}
    </div>
  );
}

function stateColor(state: string): string {
  if (state === "running") return "#22c55e";
  if (state === "suspended" || state === "interrupted") return "#f0b429";
  return "#ef4444";
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
  left: "calc(env(safe-area-inset-left, 0px) + 0.5rem)",
  zIndex: 9999,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "1.2rem",
  lineHeight: 1.45,
  padding: "0.7rem 0.9rem",
  background: "rgba(0,0,0,0.72)",
  color: "white",
  borderRadius: "0.6rem",
  maxWidth: "min(60vw, 32rem)",
  pointerEvents: "auto",
  border: "0.1rem solid rgba(255,255,255,0.15)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "0.3rem",
};

const btnStyle: CSSProperties = {
  background: "transparent",
  color: "white",
  border: "none",
  padding: "0 0.4rem",
  fontSize: "1.6rem",
  lineHeight: 1,
  cursor: "pointer",
};

const errStyle: CSSProperties = {
  color: "#ef4444",
  wordBreak: "break-word",
};

import { useRegisterSW } from "virtual:pwa-register/react";

const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        // Check for updates every hour so long-running PWA sessions get prompted
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        background: "var(--main-bg-color)",
        border: "0.15rem solid var(--main-color)",
        borderRadius: "1rem",
        padding: "1.2rem 2rem",
        display: "flex",
        alignItems: "center",
        gap: "1.2rem",
        fontSize: "1.4rem",
        fontWeight: 600,
      }}
    >
      <span>Update available</span>
      <button onClick={() => updateServiceWorker(true)}>Reload</button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{ opacity: 0.6 }}
      >
        Dismiss
      </button>
    </div>
  );
};

export default PWAUpdatePrompt;

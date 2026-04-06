import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import GamePage from "./pages/GamePage/GamePage";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
      <PWAUpdatePrompt />
    </div>
  );
}

export default App;

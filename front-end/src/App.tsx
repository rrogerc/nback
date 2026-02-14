import React from "react";
import "./App.css";

import Header from "./components/Header/Header";
import Game from "./components/Game/Game";
import Information from "./components/Information/Information";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <>
      <Header />
      <Game />
      <Information />
      <Footer />
    </>
  );
}

export default App;

import React from "react";
import Menu from "./components/Menu";
import Orders from "./components/Orders";
import Payments from "./components/Payments";
import Bills from "./components/Bills";
import Analytics from "./components/Analytics";
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ByteRisto Dashboard</h1>
      </header>
      <main>
        <Menu />
        <Orders />
        <Payments />
        <Bills />
        <Analytics />
      </main>
    </div>
  );
}

export default App;

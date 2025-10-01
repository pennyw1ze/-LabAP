import React, { useState, useEffect } from 'react';
import './App.css';

// Import existing components
import MenuDisplay from './components/MenuDisplay';
import MenuManagement from './components/MenuManagement';
import Bills from './components/Bills';
import Payments from './components/Payments';

// Import new order management components
import OrderTaking from './components/OrderTaking';
import KitchenDisplay from './components/KitchenDisplay';
import ActiveOrders from './components/ActiveOrders';

function App() {
  const [activeTab, setActiveTab] = useState('orderTaking');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'menu', label: '🍽️ Menu', component: <MenuDisplay /> },
    { id: 'menuManagement', label: '🛠️ Gestione Menu', component: <MenuManagement /> },
    { id: 'orderTaking', label: '📋 Presa Ordini', component: <OrderTaking /> },
    { id: 'activeOrders', label: '📊 Ordini Attivi', component: <ActiveOrders /> },
    { id: 'kitchen', label: '👨‍🍳 Cucina', component: <KitchenDisplay /> },
    { id: 'payments', label: '💳 Payments', component: <Payments /> },
    { id: 'bills', label: '🧾 Bills', component: <Bills /> },
  ];

  const activeComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="App">
      <div className="app-shell">
        <header className="app-topbar">
          <div>
            <h1 className="app-topbar__title">🍴 ByteRisto</h1>
            <p className="app-topbar__subtitle">Sistema di Gestione Ristorante</p>
          </div>

          <div className="app-status-strip">
            <span className="app-clock">
              {currentTime.toLocaleString('it-IT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            <span className="app-status-pill">🔥 Sistema Attivo</span>
          </div>
        </header>

        <nav className="app-tabs">
          <div className="app-tabs__inner">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`app-tab ${activeTab === tab.id ? 'app-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="app-content">
          <div className="scroll-wrap">
            <div className="scroll-wrap__inner">
              {activeComponent}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div>ByteRisto v2.0 · Sistema di Gestione Integrato</div>
          <div className="app-footer__meta">
            <span className="glass-chip">🔗 Menu Service: Attivo</span>
            <span className="glass-chip">🔗 Order Management Service: Attivo</span>
            <span className="glass-chip">📡 Real-time Updates: Attivi</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

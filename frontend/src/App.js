import React, { useState, useEffect } from 'react';
import './App.css';

// Import existing components
import MenuDisplay from './components/MenuDisplay';
import MenuManagement from './components/MenuManagement';
import Payments from './components/Payments';

// Import new order management components
import OrderTaking from './components/OrderTaking';
import KitchenDisplay from './components/KitchenDisplay';
import ActiveOrders from './components/ActiveOrders';
import RoleSelector from './components/RoleSelector';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Role-based tab configuration
  const rolePermissions = {
    client: ['menu'],
    waiter: ['menu', 'menuManagement', 'orderTaking', 'activeOrders'],
    chef: ['menu', 'menuManagement', 'kitchen'],
    cashier: ['menu', 'activeOrders', 'payments'],
    manager: ['menu', 'menuManagement', 'orderTaking', 'activeOrders', 'kitchen', 'payments']
  };

  // Handle role selection
  const handleRoleSelection = (role) => {
    setUserRole(role);
    // Set the first available tab for the selected role
    const allowedTabs = rolePermissions[role];
    if (allowedTabs && allowedTabs.length > 0) {
      setActiveTab(allowedTabs[0]);
    }
  };

  // Handle role change
  const handleChangeRole = () => {
    setUserRole(null);
    setActiveTab('menu');
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      client: '👤 Cliente',
      waiter: '🧑‍🍳 Cameriere',
      chef: '👨‍🍳 Chef',
      cashier: '💰 Cassiere',
      manager: '👔 Manager'
    };
    return roleNames[role] || role;
  };

  // Show role selector if no role is selected
  if (!userRole) {
    return <RoleSelector onSelectRole={handleRoleSelection} />;
  }

  const tabs = [
    { id: 'menu', label: '🍽️ Menu', component: <MenuDisplay /> },
    { id: 'menuManagement', label: '🛠️ Gestione Menu', component: <MenuManagement /> },
    { id: 'orderTaking', label: '📋 Presa Ordini', component: <OrderTaking /> },
    { id: 'activeOrders', label: '📊 Gestione Ordini', component: <ActiveOrders /> },
    { id: 'kitchen', label: '👨‍🍳 Cucina', component: <KitchenDisplay /> },
    { id: 'payments', label: '💳 Pagamenti', component: <Payments /> },
  ];

  // Filter tabs based on user role
  const availableTabs = tabs.filter(tab => {
    const allowedTabs = rolePermissions[userRole] || [];
    return allowedTabs.includes(tab.id);
  });

  const activeComponent = availableTabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="App">
      <header className="app-topbar app-topbar--fixed">
        <div className="app-topbar__content">
          <div className="app-topbar__row">
            <div>
              <h1 className="app-topbar__title">🍴 ByteRisto</h1>
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
              <span className="app-status-pill">{getRoleDisplayName(userRole)}</span>
              <button 
                className="button-glass button-glass--warning"
                onClick={handleChangeRole}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                Cambia Ruolo
              </button>
            </div>
          </div>

          <div className="app-topbar__tabs">
            <div className="app-tabs__inner">
              {availableTabs.map(tab => (
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
          </div>
        </div>
      </header>

      <div className="app-shell">
        <main className="app-content">
          <div className="scroll-wrap">
            <div className="scroll-wrap__inner">
              <div className="content-panel glass-card">
                {activeComponent}
              </div>
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div>ByteRisto v2.0 · Sistema di Gestione Ristorante Integrato</div>
        </footer>
      </div>
    </div>
  );
}

export default App;

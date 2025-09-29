import React, { useState } from 'react';
import './App.css';

// Import existing components
import MenuDisplay from './components/MenuDisplay';
import MenuManagement from './components/MenuManagement';
import MenuDisplayWithIngredients from './components/MenuDisplayWithIngredients';
import Analytics from './components/Analytics';
import Bills from './components/Bills';
import Payments from './components/Payments';

// Import new order management components
import OrderTaking from './components/OrderTaking';
import KitchenDisplay from './components/KitchenDisplay';
import ActiveOrders from './components/ActiveOrders';

function App() {
  const [activeTab, setActiveTab] = useState('orderTaking');

  const tabs = [
    { id: 'orderTaking', label: '📋 Presa Ordini', component: <OrderTaking /> },
    { id: 'activeOrders', label: '📊 Ordini Attivi', component: <ActiveOrders /> },
    { id: 'kitchen', label: '👨‍🍳 Cucina', component: <KitchenDisplay /> },
    { id: 'menu', label: '🍽️ Menu', component: <MenuDisplay /> },
    { id: 'menuWithIngredients', label: '🥘 Menu Completo', component: <MenuDisplayWithIngredients /> },
    { id: 'menuManagement', label: '⚙️ Gestione Menu', component: <MenuManagement /> },
    { id: 'analytics', label: '📈 Analytics', component: <Analytics /> },
    { id: 'bills', label: '🧾 Bills', component: <Bills /> },
    { id: 'payments', label: '💳 Payments', component: <Payments /> },
  ];

  const getTabStyle = (tabId) => ({
    padding: '12px 20px',
    margin: '0 4px',
    backgroundColor: activeTab === tabId ? '#0984e3' : '#f0f0f0',
    color: activeTab === tabId ? 'white' : '#333',
    border: 'none',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activeTab === tabId ? 'bold' : 'normal',
    transition: 'all 0.2s ease',
    borderBottom: activeTab === tabId ? '3px solid #0984e3' : '3px solid transparent'
  });

  const activeComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="App">
      {/* Header */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8em' }}>🍴 ByteRisto</h1>
          <div style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '2px' }}>
            Sistema di Gestione Ristorante
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
            {new Date().toLocaleString('it-IT')}
          </div>
          
          {/* Quick Status Indicators */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ 
              backgroundColor: '#ff9800', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '0.8em',
              fontWeight: 'bold'
            }}>
              🔥 Sistema Attivo
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        padding: '0 20px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={getTabStyle(tab.id)}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = '#f0f0f0';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        backgroundColor: '#ffffff',
        padding: '0'
      }}>
        {activeComponent}
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px 20px',
        textAlign: 'center',
        fontSize: '0.85em',
        color: '#666',
        borderTop: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            ByteRisto v2.0 - Sistema di Gestione Integrato
          </div>
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8em' }}>
            <span>🔗 Menu-Inventory Service: Attivo</span>
            <span>🔗 Order Management Service: Attivo</span>
            <span>📡 Real-time Updates: Attivi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

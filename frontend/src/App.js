// byteristo-frontend/src/App.js - Final version
import React, { useState } from "react";
import MenuDisplay from "./components/MenuDisplay";
import MenuDisplayWithIngredients from "./components/MenuDisplayWithIngredients";
import MenuManagement from "./components/MenuManagement";
import Inventory from "./components/Inventory";
import Orders from "./components/Orders";
import Payments from "./components/Payments";
import Bills from "./components/Bills";
import Analytics from "./components/Analytics";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('menu-full');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'menu-display':
        return <MenuDisplay />;
      case 'menu-full':
        return <MenuDisplayWithIngredients />;
      case 'menu-management':
        return <MenuManagement />;
      case 'inventory':
        return <Inventory />;
      case 'orders':
        return <Orders />;
      case 'payments':
        return <Payments />;
      case 'bills':
        return <Bills />;
      case 'analytics':
        return <Analytics />;
      default:
        return <MenuDisplayWithIngredients />;
    }
  };

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: 'auto', padding: '20px' }}>
        <h1>🍽️ ByteRisto Dashboard</h1>
        <p style={{ fontSize: '0.9em', margin: '5px 0', opacity: '0.8' }}>
          Sistema di gestione ristorante con menu e inventory integrati
        </p>
        
        {/* Navigation Tabs */}
        <nav style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveTab('menu-full')}
            style={{
              backgroundColor: activeTab === 'menu-full' ? '#4caf50' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontWeight: activeTab === 'menu-full' ? 'bold' : 'normal'
            }}
          >
            🍽️ Menu + Ingredienti
          </button>
          <button
            onClick={() => setActiveTab('menu-display')}
            style={{
              backgroundColor: activeTab === 'menu-display' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            📋 Menu Base
          </button>
          <button
            onClick={() => setActiveTab('menu-management')}
            style={{
              backgroundColor: activeTab === 'menu-management' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            ⚙️ Gestione Menu
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              backgroundColor: activeTab === 'inventory' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            📦 Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              backgroundColor: activeTab === 'orders' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            🛒 Ordini
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              backgroundColor: activeTab === 'payments' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            💳 Pagamenti
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            style={{
              backgroundColor: activeTab === 'bills' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            🧾 Fatture
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              backgroundColor: activeTab === 'analytics' ? '#0984e3' : '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            📊 Analytics
          </button>
        </nav>
      </header>

      <main style={{ 
        padding: '20px', 
        backgroundColor: 'white', 
        minHeight: '80vh',
        color: 'black'
      }}>
        {renderActiveComponent()}
      </main>

      {/* Enhanced Status Footer */}
      <footer style={{ 
        backgroundColor: '#2c3e50', 
        color: 'white',
        padding: '20px', 
        textAlign: 'center',
        borderTop: '3px solid #3498db'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '1em', marginBottom: '10px' }}>
            <strong>🔗 Menu & Inventory Microservice</strong>
          </div>
          <div style={{ fontSize: '0.9em', marginBottom: '15px', opacity: '0.9' }}>
            Connesso a: <code>http://localhost:3001/api</code>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginTop: '15px'
          }}>
            <div style={{ fontSize: '0.8em' }}>
              <strong>📋 Endpoint Menu:</strong>
              <br />GET /api/menu - Lista piatti
              <br />POST /api/menu - Crea piatto
            </div>
            <div style={{ fontSize: '0.8em' }}>
              <strong>📦 Endpoint Inventory:</strong>
              <br />GET /api/inventory - Lista ingredienti
              <br />POST /api/inventory - Crea ingrediente
            </div>
            <div style={{ fontSize: '0.8em' }}>
              <strong>🥘 Associazioni:</strong>
              <br />GET /api/menu/:id/ingredients
              <br />POST /api/menu/:id/ingredients
            </div>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '0.8em'
          }}>
            💡 <strong>Come iniziare:</strong>
            <br />1. Aggiungi ingredienti nell'inventory
            <br />2. Crea piatti nella gestione menu
            <br />3. Visualizza il menu completo con ingredienti
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
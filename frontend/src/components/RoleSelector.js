import React from 'react';
import '../styles/RoleSelector.css';

function RoleSelector({ onSelectRole }) {
  const roles = [
    {
      id: 'client',
      label: 'Cliente',
      icon: '👤',
      description: 'Visualizza il menu',
      color: 'blue'
    },
    {
      id: 'waiter',
      label: 'Cameriere',
      icon: '🧑‍🍳',
      description: 'Gestione ordini e menu',
      color: 'green'
    },
    {
      id: 'cashier',
      label: 'Cassiere',
      icon: '💰',
      description: 'Gestione pagamenti',
      color: 'purple'
    },
    {
      id: 'chef',
      label: 'Chef',
      icon: '👨‍🍳',
      description: 'Gestione cucina e menu',
      color: 'orange'
    }
  ];

  return (
    <div className="role-selector-overlay">
      <div className="role-selector">
        <div className="role-selector__header">
          <h1 className="role-selector__title">🍴 Benvenuto in ByteRisto</h1>
          <p className="role-selector__subtitle">Seleziona il tuo ruolo per continuare</p>
        </div>
        
        <div className="role-selector__grid">
          {roles.map(role => (
            <button
              key={role.id}
              className={`role-selector__card role-selector__card--${role.color}`}
              onClick={() => onSelectRole(role.id)}
            >
              <div className="role-selector__icon">{role.icon}</div>
              <h3 className="role-selector__label">{role.label}</h3>
              <p className="role-selector__description">{role.description}</p>
            </button>
          ))}
        </div>

        <div className="role-selector__footer">
          <p className="text-muted">Sistema di Gestione Ristorante Integrato</p>
        </div>
      </div>
    </div>
  );
}

export default RoleSelector;

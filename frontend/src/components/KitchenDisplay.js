import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, updateOrderItemStatus } from '../api/orderApi.js';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadOrders();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadOrders, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, filterStatus]);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Errore nell\'aggiornamento dello stato dell\'ordine');
    }
  };

  const handleItemStatusUpdate = async (orderId, itemId, newStatus) => {
    try {
      await updateOrderItemStatus(orderId, itemId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Errore nell\'aggiornamento dello stato del piatto');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#0a84ff',
      preparing: '#ff5722',
      ready: '#34c759',
      delivered: '#8e8e93',
      cancelled: '#ff453a'
    };
    return colors[status] || '#8e8e93';
  };

  const hexToRgba = (hex, alpha = 1) => {
    const sanitized = hex.replace('#', '');
    const value = sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;
    const intVal = parseInt(value, 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStatusIcon = (status) => {
    const icons = {
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '🔔',
      delivered: '📦',
      cancelled: '❌'
    };
    return icons[status] || '❓';
  };

  const getTimeSinceOrder = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} min fa`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}min fa`;
  };

  const getPriorityLevel = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));

    if (diffMinutes > 45) return 'urgent';
    if (diffMinutes > 30) return 'high';
    if (diffMinutes > 15) return 'medium';
    return 'normal';
  };

  const getFilteredOrders = () => {
    const now = new Date();

    switch (filterStatus) {
      case 'active':
        return orders.filter(order => ['confirmed', 'preparing'].includes(order.status));
      case 'ready':
        return orders.filter(order => order.status === 'ready');
      case 'today':
        return orders.filter(order => new Date(order.created_at).toDateString() === now.toDateString());
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const filterOptions = [
    { key: 'active', label: '🔥 Attivi', count: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length },
    { key: 'ready', label: '🔔 Pronti', count: orders.filter(o => o.status === 'ready').length },
    { key: 'today', label: '📅 Oggi', count: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length },
    { key: 'all', label: '📦 Tutti', count: orders.length }
  ];

  if (loading) {
    return (
      <div className="glass-card loading-panel">
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👨‍🍳</div>
        Caricamento ordini...
      </div>
    );
  }

  return (
    <div className="kitchen-display">
      <section className="kitchen-display__topbar">
        <div>
          <h1 style={{ margin: 0 }}>👨‍🍳 Cucina</h1>
          <span className="text-muted">{filteredOrders.length} ordini in vista</span>
        </div>
        <div className="kitchen-display__actions">
          <span className="app-clock">
            🕐 {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <label className="availability-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="availability-toggle__slider" aria-hidden="true" />
            <span className="availability-toggle__label">Auto-refresh</span>
          </label>
          <button type="button" className="button-glass button-glass--primary" onClick={loadOrders}>
            🔄 Aggiorna
          </button>
        </div>
      </section>

      <div className="kitchen-display__filters">
        {filterOptions.map(option => (
          <button
            key={option.key}
            type="button"
            className={`button-glass ${filterStatus === option.key ? 'button-glass--primary' : ''}`}
            onClick={() => setFilterStatus(option.key)}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '2.5rem' }}>🎉</span>
          <h3>Nessun ordine {filterStatus === 'active' ? 'attivo' : 'trovato'}</h3>
          <p className="text-muted">
            {filterStatus === 'active'
              ? 'La cucina è libera per il momento.'
              : 'Modifica il filtro per visualizzare altri ordini.'}
          </p>
        </div>
      ) : (
        <div className="kitchen-display__grid">
          {filteredOrders.map((order) => {
            const accent = getStatusColor(order.status);
            const priority = getPriorityLevel(order.created_at);
            const cardStyle = {
              borderColor: hexToRgba(accent, 0.45),
              boxShadow: `0 24px 38px -28px ${hexToRgba(accent, 0.55)}`
            };
            const headerStyle = {
              background: `linear-gradient(135deg, ${hexToRgba(accent, 0.68)}, ${hexToRgba(accent, 0.38)})`
            };

            return (
              <article key={order.id} className="kitchen-display__card" style={cardStyle}>
                <header className="kitchen-display__card-header" style={headerStyle}>
                  <div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                      {getStatusIcon(order.status)} {order.order_number}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      Tavolo {order.table_number} • {getTimeSinceOrder(order.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>€{order.final_amount}</div>
                    {order.customer_name && (
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{order.customer_name}</div>
                    )}
                  </div>
                </header>

                <div className="kitchen-display__card-body">
                  <div className={`priority-chip priority-chip--${priority}`}>
                    {priority === 'urgent' && '🚨'}
                    {priority === 'high' && '⚠️'}
                    {priority === 'medium' && '⏱️'}
                    {priority === 'normal' && '🧊'}
                    Priorità: {priority}
                  </div>

                  <div className="kitchen-display__meta">
                    <span className="text-muted">Creato alle {new Date(order.created_at).toLocaleTimeString('it-IT')}</span>
                    {order.estimated_completion_time && (
                      <span className="text-muted">Stima: {order.estimated_completion_time} min</span>
                    )}
                  </div>

                  <div className="kitchen-display__items">
                    {order.items.map((item) => (
                      <div key={item.id} className="kitchen-display__item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <strong>{item.quantity}× {item.menu_item_name}</strong>
                            {item.special_instructions && (
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>📝 {item.special_instructions}</div>
                            )}
                          </div>
                          <span className="status-badge" style={{ color: getStatusColor(item.status) }}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="kitchen-display__item-actions">
                          {item.status === 'preparing' && (
                            <button
                              type="button"
                              className="control-button control-button--success"
                              onClick={() => handleItemStatusUpdate(order.id, item.id, 'ready')}
                            >
                              ✅ Pronto
                            </button>
                          )}

                          {item.status !== 'cancelled' && item.status !== 'served' && (
                            <button
                              type="button"
                              className="control-button control-button--danger"
                              onClick={() => handleItemStatusUpdate(order.id, item.id, 'cancelled')}
                            >
                              ❌ Annulla
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.special_instructions && (
                    <div className="active-orders__notes">
                      <strong>📋 Note Ordine</strong>
                      <span className="text-muted">{order.special_instructions}</span>
                    </div>
                  )}
                </div>

                <footer className="kitchen-display__footer">
                  <div className="text-muted">Stato corrente: {order.status.toUpperCase()}</div>
                  <div className="kitchen-display__item-actions">
                    {order.status === 'confirmed' && (
                      <button
                        type="button"
                        className="button-glass button-glass--warning"
                        onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                      >
                        👨‍🍳 Inizia Preparazione
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        type="button"
                        className="button-glass button-glass--success"
                        onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                      >
                        🔔 Ordine Pronto
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        type="button"
                        className="button-glass"
                        onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                      >
                        📦 Consegnato
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, formatOrderStatus, formatOrderType, calculateOrderTiming } from '../api/orderApi';

export default function ActiveOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [selectedTable, setSelectedTable] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadOrders();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadOrders, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, selectedTable, autoRefresh]);

  const loadOrders = async () => {
    try {
      const filters = {};

      if (filter === 'active') {
        filters.status = 'active';
      } else if (filter !== 'all') {
        filters.status = filter;
      }

      if (selectedTable) {
        filters.table_number = selectedTable;
      }

      const data = await getOrders(filters);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Errore nell\'aggiornamento dello stato: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#0a84ff',
      preparing: '#ff5722',
      ready: '#34c759',
      delivered: '#8e8e93',
      payed: '#30d158',
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

  const getStatusActions = (order) => {
    const actions = [];

    switch (order.status) {
      case 'ready':
        // Nessuna azione per ordini pronti
        break;

      default:
        break;
    }

    return actions;
  };

  const getUniqueTableNumbers = () => {
    const tables = [...new Set(orders.map(order => order.table_number))];
    return tables.sort((a, b) => a - b);
  };

  const filteredOrders = orders.filter(order =>
    !selectedTable || order.table_number.toString() === selectedTable
  );

  if (loading) {
    return <div className="glass-card loading-panel">Caricamento ordini...</div>;
  }

  return (
    <div className="active-orders">
      <section className="glass-card active-orders__header">
        <div className="active-orders__title">
          <h2>📋 Gestione Ordini</h2>
        </div>

        <div className="active-orders__actions">
          <label className="availability-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="availability-toggle__slider" />
            <span className="availability-toggle__label">Auto-refresh</span>
          </label>

          <button
            type="button"
            className="button-glass button-glass--primary"
            onClick={loadOrders}
          >
            🔄 Aggiorna
          </button>
        </div>
      </section>

      <section className="glass-card active-orders__filters">
        <div className="active-orders__filters-row">
          <div className="form-field form-field--compact">
            <label className="form-label" htmlFor="order-status-filter">
              Stato
            </label>
            <select
              id="order-status-filter"
              className="select-glass"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tutti gli ordini</option>
              <option value="active">Ordini attivi</option>
              <option value="confirmed">Confermati</option>
              <option value="preparing">In preparazione</option>
              <option value="ready">Pronti</option>
              <option value="delivered">Consegnati</option>
              <option value="cancelled">Annullati</option>
            </select>
          </div>

          <div className="form-field form-field--compact">
            <label className="form-label" htmlFor="table-filter">
              Tavolo
            </label>
            <select
              id="table-filter"
              className="select-glass"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="">Tutti i tavoli</option>
              {getUniqueTableNumbers().map(table => (
                <option key={table} value={table}>Tavolo {table}</option>
              ))}
            </select>
          </div>

          <span className="active-orders__count">{filteredOrders.length} ordini trovati</span>
        </div>
      </section>

      <div className="active-orders__list">
        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <span role="img" aria-label="clipboard">📋</span>
            {filter === 'active'
              ? 'Non ci sono ordini attivi al momento.'
              : 'Prova a cambiare i filtri per visualizzare altri ordini.'}
          </div>
        )}

        {filteredOrders.map((order) => {
          const accentColor = getStatusColor(order.status);
          const timing = calculateOrderTiming(order.created_at, order.estimated_completion_time);
          const cardStyle = {
            border: `1px solid ${hexToRgba(accentColor, 0.45)}`,
            boxShadow: `0 24px 38px -28px ${hexToRgba(accentColor, 0.55)}`
          };
          const headerStyle = {
            background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.65)}, ${hexToRgba(accentColor, 0.35)})`
          };

          return (
            <article key={order.id} className="glass-card active-orders__card" style={cardStyle}>
              <header className="active-orders__card-header" style={headerStyle}>
                <div className="active-orders__card-meta">
                  <strong className="active-orders__order-number">{order.order_number}</strong>
                  <span>{formatOrderStatus(order.status)} • {formatOrderType(order.order_type)}</span>
                </div>
                <div className="active-orders__card-meta active-orders__card-meta--right">
                  <span className="status-badge">Tavolo {order.table_number}</span>
                  {order.customer_name && (
                    <span>{order.customer_name}</span>
                  )}
                </div>
              </header>

              <div className="active-orders__card-body">
                {order.status !== 'ready' && (
                  <div className={`active-orders__timing ${timing.isOverdue ? 'active-orders__timing--overdue' : ''}`}>
                    <span>
                      Ordinato {timing.elapsedMinutes} min fa • {new Date(order.created_at).toLocaleTimeString('it-IT')}
                    </span>
                    {timing.estimatedRemainingMinutes !== null && (
                      <span className={timing.isOverdue ? 'overdue' : 'text-muted'}>
                        {timing.isOverdue
                          ? `In ritardo di ${Math.abs(timing.estimatedRemainingMinutes)} min`
                          : `Stima: ${timing.estimatedRemainingMinutes} min`}
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <strong>Piatti ({order.items.length})</strong>
                  <div className="active-orders__items">
                    {order.items.map((item, index) => (
                    <div key={index} className="active-orders__item">
                        <div>
                          <span className="active-orders__item-name">
                            {item.quantity}× {item.menu_item_name}
                          </span>
                          {item.special_instructions && (
                            <span className="active-orders__item-notes">📝 {item.special_instructions}</span>
                          )}
                        </div>
                        <div className="active-orders__item-price">
                          <span>€{item.total_price}</span>
                          <span className="active-orders__item-status" style={{ color: getStatusColor(item.status) }}>
                            {formatOrderStatus(item.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.special_instructions && (
                  <div className="active-orders__items active-orders__notes">
                    <strong>📋 Note Ordine</strong>
                    <span className="text-muted">{order.special_instructions}</span>
                  </div>
                )}
              </div>

              <footer className="active-orders__footer">
                <div>
                  <div className="active-orders__footer-total">Totale: €{order.final_amount}</div>
                </div>
                <div className="active-orders__actions">
                  {getStatusActions(order)}
                </div>
              </footer>
            </article>
          );
        })}
      </div>

      <section className="glass-card active-orders__summary">
        <h3>📊 Riepilogo</h3>
        <div className="active-orders__summary-grid">
          <div className="active-orders__summary-card">
            <div className="active-orders__summary-value">
              {orders.filter(o => o.status === 'confirmed').length}
            </div>
            <div className="active-orders__summary-label">Confermati</div>
          </div>
          <div className="active-orders__summary-card">
            <div className="active-orders__summary-value">
              {orders.filter(o => o.status === 'preparing').length}
            </div>
            <div className="active-orders__summary-label">In Preparazione</div>
          </div>
          <div className="active-orders__summary-card">
            <div className="active-orders__summary-value">
              {orders.filter(o => o.status === 'ready').length}
            </div>
            <div className="active-orders__summary-label">Pronti</div>
          </div>
          <div className="active-orders__summary-card">
            <div className="active-orders__summary-value">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <div className="active-orders__summary-label">Pagati/Consegnati</div>
          </div>
          <div className="active-orders__summary-card">
            <div className="active-orders__summary-value">
              €{orders.reduce((total, order) => total + parseFloat(order.final_amount), 0).toFixed(2)}
            </div>
            <div className="active-orders__summary-label">Totale Vendite</div>
          </div>
        </div>
      </section>
    </div>
  );
}

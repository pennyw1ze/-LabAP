import React, { useState, useEffect } from 'react';
import { getOrders, payOrder, formatOrderStatus, formatOrderType, calculateOrderTiming } from '../api/orderApi';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(null);

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
  }, [selectedTable, autoRefresh]);

  const loadOrders = async () => {
    try {
      const filters = {
        status: 'ready' // Solo ordini pronti per il pagamento (delivered = già pagato)
      };

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

  const handlePayment = async (orderId, orderAmount) => {
    try {
      setProcessingPayment(orderId);
      
      // Get payment amount from user if cash payment
      let paymentAmount = orderAmount;
      if (paymentMethod === 'cash') {
        const input = prompt(`Importo ordine: €${orderAmount}\nInserisci l'importo ricevuto:`);
        if (input === null) {
          setProcessingPayment(null);
          return; // User cancelled
        }
        paymentAmount = parseFloat(input);
        if (isNaN(paymentAmount) || paymentAmount < orderAmount) {
          alert('Importo non valido o insufficiente');
          setProcessingPayment(null);
          return;
        }
      }
      
      // Mark order as paid (no actual payment processing)
      const result = await payOrder(orderId, {
        payment_method: paymentMethod,
        payment_amount: paymentAmount
      });
      
      // Show success message with change if applicable
      if (paymentMethod === 'cash' && paymentAmount > orderAmount) {
        const change = paymentAmount - orderAmount;
        alert(`Pagamento completato!\nResto: €${change.toFixed(2)}`);
      } else {
        alert('Pagamento completato con successo!');
      }
      
      // Reload orders
      await loadOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Errore nel processare il pagamento: ' + error.message);
    } finally {
      setProcessingPayment(null);
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

  const getUniqueTableNumbers = () => {
    const tables = [...new Set(orders.map(order => order.table_number))];
    return tables.sort((a, b) => a - b);
  };

  const filteredOrders = orders.filter(order =>
    !selectedTable || order.table_number.toString() === selectedTable
  );

  if (loading) {
    return <div className="glass-card loading-panel">Caricamento pagamenti...</div>;
  }

  return (
    <div className="active-orders">
      <section className="glass-card active-orders__header">
        <div className="active-orders__title">
          <h2>💳 Pagamenti</h2>
          <span className="text-muted">Gestisci i pagamenti per gli ordini pronti</span>
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

          <div className="form-field form-field--compact">
            <label className="form-label" htmlFor="payment-method">
              Metodo di Pagamento
            </label>
            <select
              id="payment-method"
              className="select-glass"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">💵 Contanti</option>
              <option value="card">💳 Carta</option>
              <option value="other">📱 Altro</option>
            </select>
          </div>

          <span className="active-orders__count">{filteredOrders.length} ordini pronti</span>
        </div>
      </section>

      <div className="active-orders__list">
        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <span role="img" aria-label="payment">💳</span>
            Non ci sono ordini pronti per il pagamento al momento.
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
                <button
                  type="button"
                  className="button-glass button-glass--success"
                  onClick={() => handlePayment(order.id, parseFloat(order.final_amount))}
                  disabled={processingPayment === order.id}
                  style={{ minWidth: '140px' }}
                >
                  {processingPayment === order.id ? '⏳ Elaborazione...' : '💰 Paga Ora'}
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      <section className="glass-card active-orders__summary">
        <div className="active-orders__summary-grid">
          <div className="active-orders__summary-card">
            <div className="active-orders__summary-value">
              €{filteredOrders.reduce((total, order) => total + parseFloat(order.final_amount), 0).toFixed(2)}
            </div>
            <div className="active-orders__summary-label">Totale da Incassare</div>
          </div>
          <div className="active-orders__summary-card">
            <button
              type="button"
              className="button-glass button-glass--success"
              onClick={async () => {
                if (filteredOrders.length === 0) {
                  alert('Non ci sono ordini da pagare');
                  return;
                }
                
                const totalAmount = filteredOrders.reduce((total, order) => total + parseFloat(order.final_amount), 0).toFixed(2);
                
                if (!window.confirm(`Confermi il pagamento di €${totalAmount} per ${filteredOrders.length} ordini?`)) {
                  return;
                }
                
                try {
                  // Process all payments
                  for (const order of filteredOrders) {
                    await payOrder(order.id, {
                      payment_method: paymentMethod,
                      payment_amount: parseFloat(order.final_amount)
                    });
                  }
                  
                  alert(`Tutti i pagamenti completati con successo! Totale: €${totalAmount}`);
                  await loadOrders();
                } catch (error) {
                  console.error('Error processing batch payment:', error);
                  alert('Errore nel processare i pagamenti: ' + error.message);
                }
              }}
              disabled={filteredOrders.length === 0 || processingPayment !== null}
              style={{ width: '100%', height: '60px', fontSize: '1.1em' }}
            >
              💰 Paga Tutti ({filteredOrders.length})
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

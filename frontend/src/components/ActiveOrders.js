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
      interval = setInterval(loadOrders, 30000); // Refresh ogni 30 secondi
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
        filters.status = 'active'; // Questo è gestito nel backend come pending, confirmed, preparing
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
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Errore nell\'aggiornamento dello stato: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff9800',
      'confirmed': '#2196f3',
      'preparing': '#ff5722',
      'ready': '#4caf50',
      'delivered': '#9e9e9e',
      'cancelled': '#f44336'
    };
    return colors[status] || '#9e9e9e';
  };

  const getStatusActions = (order) => {
    const actions = [];
    
    switch (order.status) {
      case 'pending':
        actions.push(
          <button
            key="confirm"
            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            ✅ Conferma
          </button>
        );
        actions.push(
          <button
            key="cancel"
            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ❌ Annulla
          </button>
        );
        break;
      
      case 'ready':
        actions.push(
          <button
            key="deliver"
            onClick={() => handleStatusUpdate(order.id, 'delivered')}
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📦 Consegna
          </button>
        );
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
    return <div style={{ textAlign: 'center', padding: '20px' }}>Caricamento ordini...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: 0 }}>📋 Gestione Ordini</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          
          <button 
            onClick={loadOrders}
            style={{
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Stato:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="all">Tutti gli ordini</option>
            <option value="active">Ordini attivi</option>
            <option value="pending">In attesa</option>
            <option value="confirmed">Confermati</option>
            <option value="preparing">In preparazione</option>
            <option value="ready">Pronti</option>
            <option value="delivered">Consegnati</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Tavolo:</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Tutti i tavoli</option>
            {getUniqueTableNumbers().map(table => (
              <option key={table} value={table}>Tavolo {table}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          fontSize: '0.9em', 
          color: '#666',
          marginLeft: 'auto'
        }}>
          {filteredOrders.length} ordini trovati
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '2em', marginBottom: '15px' }}>📋</div>
          <h3>Nessun ordine trovato</h3>
          <p>
            {filter === 'active' ? 
              'Non ci sono ordini attivi al momento' : 
              'Prova a cambiare i filtri per vedere altri ordini'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredOrders.map((order) => {
            const timing = calculateOrderTiming(order.created_at, order.estimated_completion_time);
            
            return (
              <div 
                key={order.id}
                style={{ 
                  border: `2px solid ${getStatusColor(order.status)}`,
                  borderRadius: '8px', 
                  backgroundColor: 'white',
                  boxShadow: timing.isOverdue ? '0 4px 8px rgba(244, 67, 54, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* Order Header */}
                <div style={{ 
                  backgroundColor: getStatusColor(order.status),
                  color: 'white',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                      {formatOrderStatus(order.status)} • {formatOrderType(order.order_type)}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                      Tavolo {order.table_number}
                    </div>
                    {order.customer_name && (
                      <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                        {order.customer_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timing Info */}
                <div style={{ 
                  padding: '10px 15px',
                  backgroundColor: timing.isOverdue ? '#ffebee' : '#f8f9fa',
                  borderBottom: '1px solid #eee',
                  fontSize: '0.9em'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Ordinato {timing.elapsedMinutes} min fa • {new Date(order.created_at).toLocaleTimeString('it-IT')}
                    </span>
                    
                    {timing.estimatedRemainingMinutes !== null && (
                      <span style={{ 
                        color: timing.isOverdue ? '#f44336' : '#666',
                        fontWeight: timing.isOverdue ? 'bold' : 'normal'
                      }}>
                        {timing.isOverdue ? 
                          `In ritardo di ${Math.abs(timing.estimatedRemainingMinutes)} min` :
                          `Stima: ${timing.estimatedRemainingMinutes} min`
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ padding: '15px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Piatti ({order.items.length}):</strong>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {order.items.map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>
                            {item.quantity}x {item.menu_item_name}
                          </span>
                          {item.special_instructions && (
                            <div style={{ 
                              fontSize: '0.8em', 
                              color: '#666',
                              marginTop: '2px'
                            }}>
                              📝 {item.special_instructions}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>
                            €{item.total_price}
                          </div>
                          <div style={{ 
                            fontSize: '0.8em',
                            color: getStatusColor(item.status),
                            fontWeight: 'bold'
                          }}>
                            {formatOrderStatus(item.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.special_instructions && (
                    <div style={{ 
                      marginTop: '15px',
                      padding: '10px',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #2196f3',
                      borderRadius: '4px'
                    }}>
                      <strong>📋 Note Ordine:</strong>
                      <div style={{ marginTop: '4px' }}>{order.special_instructions}</div>
                    </div>
                  )}
                </div>

                {/* Order Footer */}
                <div style={{ 
                  padding: '15px',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                      Totale: €{order.final_amount}
                    </div>
                    {order.tax_amount > 0 && (
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        (di cui IVA: €{order.tax_amount})
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {getStatusActions(order)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>📊 Riepilogo</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '16px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#ff9800' }}>
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>In Attesa</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#2196f3' }}>
              {orders.filter(o => o.status === 'confirmed').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Confermati</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#ff5722' }}>
              {orders.filter(o => o.status === 'preparing').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>In Preparazione</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#4caf50' }}>
              {orders.filter(o => o.status === 'ready').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Pronti</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#9e9e9e' }}>
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Consegnati</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#0984e3' }}>
              €{orders.reduce((total, order) => total + parseFloat(order.final_amount), 0).toFixed(2)}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Totale Vendite</div>
          </div>
        </div>
      </div>
    </div>
  );
}
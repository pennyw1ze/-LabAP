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
      interval = setInterval(loadOrders, 10000); // Refresh every 10 seconds
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
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Errore nell\'aggiornamento dello stato dell\'ordine');
    }
  };

  const handleItemStatusUpdate = async (orderId, itemId, newStatus) => {
    try {
      await updateOrderItemStatus(orderId, itemId, newStatus);
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Errore nell\'aggiornamento dello stato del piatto');
    }
  };

  const getFilteredOrders = () => {
    const now = new Date();
    
    switch (filterStatus) {
      case 'active':
        return orders.filter(order => ['confirmed', 'preparing'].includes(order.status));
      case 'pending':
        return orders.filter(order => order.status === 'pending');
      case 'ready':
        return orders.filter(order => order.status === 'ready');
      case 'today':
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === now.toDateString();
        });
      default:
        return orders;
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

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '🔔',
      'delivered': '📦',
      'cancelled': '❌'
    };
    return icons[status] || '❓';
  };

  const getTimeSinceOrder = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min fa`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ${diffMinutes % 60}min fa`;
    }
  };

  const getPriorityLevel = (createdAt, estimatedTime) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffMinutes > 45) return 'urgent';
    if (diffMinutes > 30) return 'high';
    if (diffMinutes > 15) return 'medium';
    return 'normal';
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '2em', marginBottom: '20px' }}>👨‍🍳</div>
        <div>Caricamento ordini...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        borderRadius: '8px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2em' }}>👨‍🍳 CUCINA</h1>
          <div style={{ fontSize: '1.2em', opacity: 0.8 }}>
            {filteredOrders.length} ordini attivi
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '1.5em' }}>
            🕐 {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'active', label: '🔥 Attivi', count: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length },
          { key: 'pending', label: '⏳ In attesa', count: orders.filter(o => o.status === 'pending').length },
          { key: 'ready', label: '🔔 Pronti', count: orders.filter(o => o.status === 'ready').length },
          { key: 'today', label: '📅 Oggi', count: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key)}
            style={{
              backgroundColor: filterStatus === filter.key ? '#0984e3' : '#f0f0f0',
              color: filterStatus === filter.key ? 'white' : 'black',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '3em', marginBottom: '20px' }}>🎉</div>
          <h3>Nessun ordine {filterStatus === 'active' ? 'attivo' : 'trovato'}</h3>
          <p>
            {filterStatus === 'active' ? 
              'Tutti gli ordini sono stati completati!' : 
              'Cambia il filtro per vedere altri ordini'
            }
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredOrders.map((order) => {
            const priority = getPriorityLevel(order.created_at, order.estimated_completion_time);
            const priorityColors = {
              'urgent': '#f44336',
              'high': '#ff9800',
              'medium': '#ffeb3b',
              'normal': '#4caf50'
            };

            return (
              <div 
                key={order.id} 
                style={{ 
                  border: `3px solid ${priorityColors[priority]}`,
                  borderRadius: '8px', 
                  backgroundColor: 'white',
                  boxShadow: priority === 'urgent' ? '0 4px 8px rgba(244, 67, 54, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
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
                    <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>
                      {getStatusIcon(order.status)} {order.order_number}
                    </div>
                    <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                      Tavolo {order.table_number} • {getTimeSinceOrder(order.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                      €{order.final_amount}
                    </div>
                    {order.customer_name && (
                      <div style={{ fontSize: '0.8em', opacity: 0.9 }}>
                        {order.customer_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Badge */}
                {priority === 'urgent' && (
                  <div style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    textAlign: 'center',
                    padding: '8px',
                    fontWeight: 'bold',
                    animation: 'blink 2s infinite'
                  }}>
                    🚨 URGENTE - Oltre 45 minuti! 🚨
                  </div>
                )}

                {/* Order Items */}
                <div style={{ padding: '15px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Piatti ({order.items.length}):</strong>
                  </div>
                  
                  {order.items.map((item, index) => (
                    <div key={index} style={{ 
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      border: `2px solid ${getStatusColor(item.status)}`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                          {item.quantity}x {item.menu_item_name}
                        </div>
                        <div style={{ 
                          backgroundColor: getStatusColor(item.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8em',
                          fontWeight: 'bold'
                        }}>
                          {getStatusIcon(item.status)} {item.status.toUpperCase()}
                        </div>
                      </div>

                      {item.special_instructions && (
                        <div style={{ 
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          padding: '8px',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          fontSize: '0.9em'
                        }}>
                          <strong>📝 Note:</strong> {item.special_instructions}
                        </div>
                      )}

                      {/* Item Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleItemStatusUpdate(order.id, item.id, 'preparing')}
                            style={{
                              backgroundColor: '#ff5722',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8em',
                              fontWeight: 'bold'
                            }}
                          >
                            👨‍🍳 Inizia Preparazione
                          </button>
                        )}
                        
                        {item.status === 'preparing' && (
                          <button
                            onClick={() => handleItemStatusUpdate(order.id, item.id, 'ready')}
                            style={{
                              backgroundColor: '#4caf50',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8em',
                              fontWeight: 'bold'
                            }}
                          >
                            ✅ Pronto
                          </button>
                        )}

                        {item.status !== 'cancelled' && item.status !== 'served' && (
                          <button
                            onClick={() => handleItemStatusUpdate(order.id, item.id, 'cancelled')}
                            style={{
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8em'
                            }}
                          >
                            ❌ Annulla
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Order Notes */}
                  {order.special_instructions && (
                    <div style={{ 
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #2196f3',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '10px'
                    }}>
                      <strong>📋 Note Ordine:</strong>
                      <div style={{ marginTop: '4px' }}>{order.special_instructions}</div>
                    </div>
                  )}
                </div>

                {/* Order Actions */}
                <div style={{ 
                  padding: '15px',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                      style={{
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    >
                      ✅ Conferma Ordine
                    </button>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                      style={{
                        backgroundColor: '#ff5722',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    >
                      👨‍🍳 Inizia Preparazione
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                      style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    >
                      🔔 Ordine Pronto
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                      style={{
                        backgroundColor: '#9e9e9e',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    >
                      📦 Consegnato
                    </button>
                  )}

                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      ❌ Annulla
                    </button>
                  )}
                </div>

                {/* Order Timing Info */}
                <div style={{ 
                  backgroundColor: '#f0f0f0',
                  padding: '10px 15px',
                  fontSize: '0.8em',
                  color: '#666',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Ordinato: {new Date(order.created_at).toLocaleTimeString('it-IT')}</span>
                  {order.estimated_completion_time && (
                    <span>Stimato: {new Date(order.estimated_completion_time).toLocaleTimeString('it-IT')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistics Panel */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>📊 Statistiche Cucina</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '16px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ff9800' }}>
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <div style={{ color: '#666' }}>In Attesa</div>
          </div>
          <div>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ff5722' }}>
              {orders.filter(o => o.status === 'preparing').length}
            </div>
            <div style={{ color: '#666' }}>In Preparazione</div>
          </div>
          <div>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#4caf50' }}>
              {orders.filter(o => o.status === 'ready').length}
            </div>
            <div style={{ color: '#666' }}>Pronti</div>
          </div>
          <div>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2196f3' }}>
              {orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length}
            </div>
            <div style={{ color: '#666' }}>Attivi</div>
          </div>
          <div>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#9e9e9e' }}>
              {orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
            </div>
            <div style={{ color: '#666' }}>Oggi</div>
          </div>
        </div>
      </div>

      {/* CSS for blinking animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
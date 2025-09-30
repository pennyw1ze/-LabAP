import React, { useState, useEffect } from 'react';
import { getMenu, createOrder } from '../api';

export default function OrderTaking() {
  const [menuItems, setMenuItems] = useState([]);
  const [currentOrder, setCurrentOrder] = useState({
    table_number: '',
    customer_name: '',
    order_type: 'dine_in',
    special_instructions: '',
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const menuData = await getMenu({ available: true });
      setMenuItems(menuData);
    } catch (error) {
      console.error('Error loading menu:', error);
      alert('Errore nel caricamento del menu');
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = (menuItem) => {
    const existingItemIndex = currentOrder.items.findIndex(item => item.menu_item_id === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity if item already exists
      const updatedItems = [...currentOrder.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * menuItem.price;
      
      setCurrentOrder(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
      // Add new item
      const newItem = {
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.name,
        quantity: 1,
        unit_price: menuItem.price,
        total_price: menuItem.price,
        special_instructions: ''
      };
      
      setCurrentOrder(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const removeItemFromOrder = (menuItemId) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.menu_item_id !== menuItemId)
    }));
  };

  const updateItemQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(menuItemId);
      return;
    }

    const updatedItems = currentOrder.items.map(item => {
      if (item.menu_item_id === menuItemId) {
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.unit_price
        };
      }
      return item;
    });

    setCurrentOrder(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const updateItemInstructions = (menuItemId, instructions) => {
    const updatedItems = currentOrder.items.map(item => {
      if (item.menu_item_id === menuItemId) {
        return { ...item, special_instructions: instructions };
      }
      return item;
    });

    setCurrentOrder(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const calculateOrderTotal = () => {
    return currentOrder.items.reduce((total, item) => total + item.total_price, 0);
  };

  const submitOrder = async () => {
    if (!currentOrder.table_number) {
      alert('Inserire il numero del tavolo');
      return;
    }

    if (currentOrder.items.length === 0) {
      alert('Aggiungere almeno un piatto all\'ordine');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        ...currentOrder,
        total_amount: calculateOrderTotal()
      };

      const result = await createOrder(orderData);
      
      // Add to order history
      setOrderHistory(prev => [result, ...prev]);
      
      // Reset current order
      setCurrentOrder({
        table_number: '',
        customer_name: '',
        order_type: 'dine_in',
        special_instructions: '',
        items: []
      });

      alert(`Ordine ${result.order_number} inviato con successo alla cucina!`);
      
      // Aggiorna il menu per riflettere eventuali variazioni di disponibilità manuale
      loadMenuData();
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Errore nella creazione dell\'ordine: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', 'appetizer', 'main', 'dessert', 'beverage', 'side'];
  const categoryLabels = {
    all: 'Tutti',
    appetizer: 'Antipasti',
    main: 'Primi Piatti',
    dessert: 'Dolci',
    beverage: 'Bevande',
    side: 'Contorni'
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return <div>Caricamento menu...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Menu Selection - Left Side */}
      <div style={{ flex: '2', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <h2>📋 Presa Ordini</h2>

        {/* Category Filter */}
        <div style={{ marginBottom: '20px' }}>
          <h3>Categorie:</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  backgroundColor: selectedCategory === category ? '#0984e3' : '#ddd',
                  color: selectedCategory === category ? 'white' : 'black',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
          {filteredMenuItems.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '6px', 
                  padding: '12px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => addItemToOrder(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1em', color: 'black' }}>
                    {item.name}
                  </h4>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#0984e3' }}>
                      €{item.price}
                    </div>
                    <div style={{ fontSize: '0.7em', color: '#666' }}>
                      {item.preparation_time} min
                    </div>
                  </div>
                </div>
                
                {item.description && (
                  <p style={{ margin: '4px 0', fontSize: '0.8em', color: '#666' }}>
                    {item.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em' }}>
                  <span style={{ 
                    color: '#4caf50',
                    fontWeight: 'bold'
                  }}>
                    ✅ Disponibile
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addItemToOrder(item);
                    }}
                    style={{
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8em'
                    }}
                  >
                    + Aggiungi
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Current Order - Right Side */}
      <div style={{ flex: '1', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #0984e3' }}>
        <h3>🛒 Ordine Corrente</h3>

        {/* Order Info */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Tavolo N°:
            </label>
            <input
              type="number"
              value={currentOrder.table_number}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, table_number: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              placeholder="Es. 5"
              min="1"
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Nome Cliente (opzionale):
            </label>
            <input
              type="text"
              value={currentOrder.customer_name}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, customer_name: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              placeholder="Nome del cliente"
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Tipo Ordine:
            </label>
            <select
              value={currentOrder.order_type}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, order_type: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="dine_in">Al Tavolo</option>
              <option value="takeout">Da Asporto</option>
              <option value="delivery">Consegna</option>
            </select>
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Piatti Ordinati ({currentOrder.items.length}):</h4>
          
          {currentOrder.items.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Nessun piatto selezionato</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {currentOrder.items.map((item, index) => (
                <div key={index} style={{ 
                  border: '1px solid #eee', 
                  borderRadius: '4px', 
                  padding: '10px', 
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.9em' }}>{item.menu_item_name}</strong>
                    <button
                      onClick={() => removeItemFromOrder(item.menu_item_id)}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <button
                      onClick={() => updateItemQuantity(item.menu_item_id, item.quantity - 1)}
                      style={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItemQuantity(item.menu_item_id, item.quantity + 1)}
                      style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      +
                    </button>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                      €{item.total_price.toFixed(2)}
                    </span>
                  </div>

                  <textarea
                    placeholder="Note speciali per questo piatto..."
                    value={item.special_instructions}
                    onChange={(e) => updateItemInstructions(item.menu_item_id, e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '40px',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '2px',
                      fontSize: '0.8em',
                      resize: 'vertical'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Note generali ordine:
          </label>
          <textarea
            value={currentOrder.special_instructions}
            onChange={(e) => setCurrentOrder(prev => ({ ...prev, special_instructions: e.target.value }))}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              resize: 'vertical'
            }}
            placeholder="Note speciali per l'ordine..."
          />
        </div>

        {/* Order Total */}
        {currentOrder.items.length > 0 && (
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#0984e3' }}>
              Totale: €{calculateOrderTotal().toFixed(2)}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={submitOrder}
          disabled={submitting || currentOrder.items.length === 0 || !currentOrder.table_number}
          style={{
            width: '100%',
            backgroundColor: submitting ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '1em',
            fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? '🕐 Invio in corso...' : '🚀 Invia Ordine alla Cucina'}
        </button>

        {/* Recent Orders */}
        {orderHistory.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h4>📋 Ultimi Ordini Inviati:</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {orderHistory.slice(0, 5).map((order) => (
                <div key={order.id} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '8px', 
                  marginBottom: '8px',
                  fontSize: '0.9em'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{order.order_number}</strong>
                    <span>Tavolo {order.table_number}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: '0.8em' }}>
                    {order.items.length} piatti - €{order.final_amount} - {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

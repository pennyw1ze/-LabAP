import React, { useState, useEffect } from 'react';
import { getMenu } from '../api';
import { createOrder } from '../api/orderApi';

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
      const updatedItems = [...currentOrder.items];
      const updatedItem = { ...updatedItems[existingItemIndex] };
      updatedItem.quantity += 1;
      updatedItem.total_price = updatedItem.quantity * menuItem.price;
      updatedItems[existingItemIndex] = updatedItem;

      setCurrentOrder(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
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

      setOrderHistory(prev => [result, ...prev]);
      setCurrentOrder({
        table_number: '',
        customer_name: '',
        order_type: 'dine_in',
        special_instructions: '',
        items: []
      });

      alert(`Ordine ${result.order_number} inviato con successo alla cucina!`);
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
    return <div className="glass-card loading-panel">Caricamento menu...</div>;
  }

  return (
    <div className="order-taking">
      <section className="order-taking__menu glass-card">
        <div className="order-taking__header">
          <h2>📋 Presa Ordini</h2>
        </div>

        <div className="form-section">
          <h3>Categorie</h3>
          <div className="order-taking__category-buttons">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={`button-glass order-taking__category-button ${selectedCategory === category ? 'button-glass--primary' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </div>

        <div className="order-taking__grid">
          {filteredMenuItems.length === 0 && (
            <div className="empty-state">
              Nessun piatto nella categoria {categoryLabels[selectedCategory]}.
            </div>
          )}

          {filteredMenuItems.map((item) => (
            <article
              key={item.id}
              className="order-taking__item"
              onClick={() => addItemToOrder(item)}
            >
              <div className="order-taking__item-header">
                <div>
                  <h4>{item.name}</h4>
                  {item.description && (
                    <p className="text-muted">{item.description}</p>
                  )}
                </div>
                <div className="order-taking__item-price">
                  <div>€{item.price}</div>
                  <small className="text-muted">{item.preparation_time} min</small>
                </div>
              </div>

              <div className="order-taking__item-footer">
                <span className="chip-positive">✅ Disponibile</span>
                <button
                  type="button"
                  className="button-glass button-glass--success order-taking__add-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addItemToOrder(item);
                  }}
                >
                  + Aggiungi
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="order-taking__summary glass-card">
        <h3>🛒 Ordine Corrente</h3>

        <div className="form-section">
          <div className="form-field">
            <label className="form-label" htmlFor="table-number">
              Tavolo N°
            </label>
            <input
              id="table-number"
              type="number"
              min="1"
              className="input-glass"
              placeholder="Es. 5"
              value={currentOrder.table_number}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, table_number: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="customer-name">
              Nome Cliente (opzionale)
            </label>
            <input
              id="customer-name"
              type="text"
              className="input-glass"
              placeholder="Nome del cliente"
              value={currentOrder.customer_name}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, customer_name: e.target.value }))}
            />
          </div>

        </div>

        <div className="form-section">
          <h4>Piatti Ordinati ({currentOrder.items.length})</h4>
          {currentOrder.items.length === 0 ? (
            <div className="empty-state">Nessun piatto selezionato</div>
          ) : (
            <div className="order-taking__list">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="order-taking__list-item">
                  <div className="order-taking__actions">
                    <strong>{item.menu_item_name}</strong>
                    <button
                      type="button"
                      className="control-button control-button--danger"
                      onClick={() => removeItemFromOrder(item.menu_item_id)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="order-taking__actions">
                    <button
                      type="button"
                      className="control-button control-button--warning"
                      onClick={() => updateItemQuantity(item.menu_item_id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="order-taking__quantity">{item.quantity}</span>
                    <button
                      type="button"
                      className="control-button control-button--success"
                      onClick={() => updateItemQuantity(item.menu_item_id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <span className="order-taking__price">€{item.total_price.toFixed(2)}</span>
                  </div>

                  <textarea
                    className="textarea-glass"
                    placeholder="Note speciali per questo piatto..."
                    value={item.special_instructions}
                    onChange={(e) => updateItemInstructions(item.menu_item_id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-field">
            <label className="form-label" htmlFor="order-notes">
              Note generali ordine
            </label>
            <textarea
              id="order-notes"
              className="textarea-glass"
              placeholder="Note speciali per l'ordine..."
              value={currentOrder.special_instructions}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, special_instructions: e.target.value }))}
            />
          </div>
        </div>

        {currentOrder.items.length > 0 && (
          <div className="order-taking__total-card">
            <div>Totale</div>
            <div className="order-taking__total-card-value">
              €{calculateOrderTotal().toFixed(2)}
            </div>
          </div>
        )}

        <button
          type="button"
          className="button-glass button-glass--success order-taking__submit"
          onClick={submitOrder}
          disabled={submitting || currentOrder.items.length === 0 || !currentOrder.table_number}
        >
          {submitting ? '🕐 Invio in corso...' : '🚀 Invia Ordine alla Cucina'}
        </button>

        {orderHistory.length > 0 && (
          <div>
            <h4>📋 Ultimi Ordini Inviati</h4>
            <div className="order-taking__history">
              {orderHistory.slice(0, 5).map((order) => (
                <div key={order.id} className="order-taking__history-item">
                  <div className="order-taking__history-header">
                    <strong>{order.order_number}</strong>
                    <span className="text-muted">Tavolo {order.table_number}</span>
                  </div>
                  <div className="text-muted">
                    {order.items.length} piatti · €{order.final_amount} · {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

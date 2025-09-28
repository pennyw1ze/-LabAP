// byteristo-frontend/src/components/Inventory.js
import React, { useState, useEffect } from 'react';
import { getInventory, getInventoryAlerts, createInventoryItem, adjustInventoryStock } from '../api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current_stock: 0,
    minimum_stock: 0,
    maximum_stock: 100,
    unit: '',
    cost_per_unit: 0,
    supplier: '',
    expiry_date: '',
    is_perishable: false
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [inventoryData, alertsData] = await Promise.all([
        getInventory(),
        getInventoryAlerts()
      ]);
      setInventory(inventoryData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInventoryItem(formData);
      setFormData({
        name: '',
        description: '',
        current_stock: 0,
        minimum_stock: 0,
        maximum_stock: 100,
        unit: '',
        cost_per_unit: 0,
        supplier: '',
        expiry_date: '',
        is_perishable: false
      });
      setShowAddForm(false);
      loadInventoryData(); // Reload data
    } catch (error) {
      console.error('Error creating inventory item:', error);
      alert('Errore nella creazione dell\'articolo');
    }
  };

  const handleAdjustStock = async (itemId, adjustment) => {
    try {
      await adjustInventoryStock(itemId, adjustment);
      loadInventoryData(); // Reload data
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Errore nell\'aggiustamento dello stock');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div>Caricamento inventory...</div>;
  }

  return (
    <div>
      <h2>Gestione Inventory</h2>
      
      {/* Alerts Section */}
      {(alerts.low_stock_count > 0 || alerts.out_of_stock_count > 0 || alerts.expiring_soon_count > 0) && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '10px', 
          marginBottom: '20px' 
        }}>
          <h3>🚨 Avvisi</h3>
          {alerts.out_of_stock_count > 0 && (
            <p style={{ color: '#d63031' }}>❌ Articoli esauriti: {alerts.out_of_stock_count}</p>
          )}
          {alerts.low_stock_count > 0 && (
            <p style={{ color: '#e17000' }}>⚠️ Articoli con stock basso: {alerts.low_stock_count}</p>
          )}
          {alerts.expiring_soon_count > 0 && (
            <p style={{ color: '#e17000' }}>📅 Articoli in scadenza: {alerts.expiring_soon_count}</p>
          )}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? 'Annulla' : 'Aggiungi Articolo'}
        </button>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          <h3>Nuovo Articolo Inventory</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <input
              type="text"
              name="name"
              placeholder="Nome articolo"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="unit"
              placeholder="Unità (kg, pz, l, etc.)"
              value={formData.unit}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="current_stock"
              placeholder="Stock attuale"
              value={formData.current_stock}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
            />
            <input
              type="number"
              name="minimum_stock"
              placeholder="Stock minimo"
              value={formData.minimum_stock}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
            />
            <input
              type="number"
              name="maximum_stock"
              placeholder="Stock massimo"
              value={formData.maximum_stock}
              onChange={handleInputChange}
              min="1"
              step="0.1"
              required
            />
            <input
              type="number"
              name="cost_per_unit"
              placeholder="Costo per unità (€)"
              value={formData.cost_per_unit}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
            />
            <input
              type="text"
              name="supplier"
              placeholder="Fornitore"
              value={formData.supplier}
              onChange={handleInputChange}
            />
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleInputChange}
            />
          </div>
          <textarea
            name="description"
            placeholder="Descrizione"
            value={formData.description}
            onChange={handleInputChange}
            style={{ width: '100%', marginTop: '10px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <input
              type="checkbox"
              name="is_perishable"
              checked={formData.is_perishable}
              onChange={handleInputChange}
              style={{ marginRight: '8px' }}
            />
            Articolo deperibile
          </label>
          <div style={{ marginTop: '10px' }}>
            <button type="submit" style={{
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}>
              Salva
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={{
              backgroundColor: '#636e72',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Inventory List */}
      <div>
        <h3>Articoli in Inventory ({inventory.length})</h3>
        {inventory.length === 0 ? (
          <p>Nessun articolo nell'inventory</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Nome</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Stock</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Unità</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Costo/Unità</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Stato</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>
                      <strong>{item.name}</strong>
                      {item.description && <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {item.description}
                      </div>}
                      {item.supplier && <div style={{ fontSize: '0.8em', color: '#666' }}>
                        Fornitore: {item.supplier}
                      </div>}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {item.current_stock} / {item.maximum_stock}
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        Min: {item.minimum_stock}
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>{item.unit}</td>
                    <td style={{ padding: '8px' }}>€{item.cost_per_unit}</td>
                    <td style={{ padding: '8px' }}>
                      {item.current_stock <= 0 ? (
                        <span style={{ color: '#d63031', fontWeight: 'bold' }}>ESAURITO</span>
                      ) : item.current_stock <= item.minimum_stock ? (
                        <span style={{ color: '#e17000', fontWeight: 'bold' }}>STOCK BASSO</span>
                      ) : (
                        <span style={{ color: '#00b894' }}>OK</span>
                      )}
                      {item.is_perishable && (
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                          🥬 Deperibile
                          {item.expiry_date && ` - Scade: ${new Date(item.expiry_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleAdjustStock(item.id, -1)}
                          style={{ 
                            backgroundColor: '#d63031', 
                            color: 'white', 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                          disabled={item.current_stock <= 0}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item.id, 1)}
                          style={{ 
                            backgroundColor: '#00b894', 
                            color: 'white', 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          +1
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
// byteristo-frontend/src/components/MenuManagement.js
import React, { useState, useEffect } from 'react';
import { getMenu, getInventory, createMenuItem } from '../api';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'main',
    is_available: true,
    preparation_time: 15,
    allergens: '',
    nutritional_info: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuData, inventoryData] = await Promise.all([
        getMenu(),
        getInventory()
      ]);
      setMenuItems(menuData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const menuItemData = {
        ...formData,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time),
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : null,
        nutritional_info: {
          calories: formData.nutritional_info.calories ? parseInt(formData.nutritional_info.calories) : null,
          protein: formData.nutritional_info.protein ? parseFloat(formData.nutritional_info.protein) : null,
          carbs: formData.nutritional_info.carbs ? parseFloat(formData.nutritional_info.carbs) : null,
          fat: formData.nutritional_info.fat ? parseFloat(formData.nutritional_info.fat) : null,
        }
      };

      await createMenuItem(menuItemData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'main',
        is_available: true,
        preparation_time: 15,
        allergens: '',
        nutritional_info: {
          calories: '',
          protein: '',
          carbs: '',
          fat: ''
        }
      });
      setShowAddForm(false);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error creating menu item:', error);
      alert('Errore nella creazione del piatto');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('nutritional_info.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nutritional_info: {
          ...prev.nutritional_info,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div>
      <h2>Gestione Menu</h2>

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
          {showAddForm ? 'Annulla' : 'Aggiungi Piatto'}
        </button>
      </div>

      {/* Add Menu Item Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          <h3>Nuovo Piatto</h3>
          
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              name="name"
              placeholder="Nome del piatto"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="appetizer">Antipasto</option>
              <option value="main">Primo Piatto</option>
              <option value="dessert">Dolce</option>
              <option value="beverage">Bevanda</option>
              <option value="side">Contorno</option>
            </select>
            <input
              type="number"
              name="price"
              placeholder="Prezzo (€)"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
            />
            <input
              type="number"
              name="preparation_time"
              placeholder="Tempo preparazione (min)"
              value={formData.preparation_time}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>

          <textarea
            name="description"
            placeholder="Descrizione del piatto"
            value={formData.description}
            onChange={handleInputChange}
            style={{ width: '100%', marginBottom: '15px', minHeight: '60px' }}
          />

          <input
            type="text"
            name="allergens"
            placeholder="Allergeni (separati da virgola)"
            value={formData.allergens}
            onChange={handleInputChange}
            style={{ width: '100%', marginBottom: '15px' }}
          />

          {/* Nutritional Info */}
          <h4>Informazioni Nutrizionali (opzionali)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
            <input
              type="number"
              name="nutritional_info.calories"
              placeholder="Calorie"
              value={formData.nutritional_info.calories}
              onChange={handleInputChange}
              min="0"
            />
            <input
              type="number"
              name="nutritional_info.protein"
              placeholder="Proteine (g)"
              value={formData.nutritional_info.protein}
              onChange={handleInputChange}
              min="0"
              step="0.1"
            />
            <input
              type="number"
              name="nutritional_info.carbs"
              placeholder="Carboidrati (g)"
              value={formData.nutritional_info.carbs}
              onChange={handleInputChange}
              min="0"
              step="0.1"
            />
            <input
              type="number"
              name="nutritional_info.fat"
              placeholder="Grassi (g)"
              value={formData.nutritional_info.fat}
              onChange={handleInputChange}
              min="0"
              step="0.1"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleInputChange}
              style={{ marginRight: '8px' }}
            />
            Disponibile per gli ordini
          </label>

          {/* Ingredient Selection Note */}
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            fontSize: '0.9em'
          }}>
            <strong>📝 Nota:</strong> La selezione degli ingredienti dall'inventory richiede 
            l'implementazione della tabella di associazione many-to-many nel backend. 
            Per ora puoi creare il piatto e successivamente collegare gli ingredienti 
            direttamente nel database o tramite API dedicate.
          </div>

          <div>
            <button type="submit" style={{
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}>
              Salva Piatto
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

      {/* Current Menu Items */}
      <div>
        <h3>Piatti Attuali ({menuItems.length})</h3>
        {menuItems.length === 0 ? (
          <p>Nessun piatto nel menu. Inizia aggiungendone uno!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Nome</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Categoria</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Prezzo</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Tempo Prep.</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Disponibilità</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Allergeni</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', textTransform: 'capitalize' }}>
                      {item.category}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>
                      €{item.price}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {item.preparation_time} min
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ 
                        color: item.is_available ? '#00b894' : '#d63031',
                        fontWeight: 'bold'
                      }}>
                        {item.is_available ? '✅ Sì' : '❌ No'}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      {item.allergens && item.allergens.length > 0 ? (
                        <span style={{ fontSize: '0.8em', color: '#e17000' }}>
                          {item.allergens.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: '#666' }}>Nessuno</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Ingredients from Inventory */}
      <div style={{ marginTop: '30px' }}>
        <h3>Ingredienti Disponibili nell'Inventory ({inventory.length})</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {inventory.length === 0 ? (
            <p style={{ margin: 0, color: '#666' }}>
              Nessun ingrediente nell'inventory. Vai alla sezione Inventory per aggiungerne.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {inventory.map(item => (
                <span 
                  key={item.id}
                  style={{ 
                    backgroundColor: item.current_stock > 0 ? '#d1edff' : '#ffe6e6',
                    color: item.current_stock > 0 ? '#0984e3' : '#d63031',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    border: `1px solid ${item.current_stock > 0 ? '#0984e3' : '#d63031'}`
                  }}
                >
                  {item.name} ({item.current_stock} {item.unit})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
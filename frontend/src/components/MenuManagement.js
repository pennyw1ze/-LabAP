// byteristo-frontend/src/components/MenuManagement.js
import React, { useState, useEffect } from 'react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../api';

const getInitialFormState = () => ({
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

const AvailabilityToggle = ({
  checked,
  onChange,
  name = 'is_available',
  id,
  labelOn = 'Disponibile',
  labelOff = 'Non disponibile'
}) => (
  <label className="availability-toggle">
    <input
      id={id}
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
    />
    <span className="availability-toggle__slider" aria-hidden="true" />
    <span className="availability-toggle__label">
      {checked ? labelOn : labelOff}
    </span>
  </label>
);

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const menuData = await getMenu();
      setMenuItems(menuData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormState());
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const menuItemData = {
        ...formData,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time, 10),
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : null,
        nutritional_info: {
          calories: formData.nutritional_info.calories ? parseInt(formData.nutritional_info.calories, 10) : null,
          protein: formData.nutritional_info.protein ? parseFloat(formData.nutritional_info.protein) : null,
          carbs: formData.nutritional_info.carbs ? parseFloat(formData.nutritional_info.carbs) : null,
          fat: formData.nutritional_info.fat ? parseFloat(formData.nutritional_info.fat) : null,
        }
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, menuItemData);
      } else {
        await createMenuItem(menuItemData);
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Errore nel salvataggio del piatto');
    }
  };

  const handleEdit = (menuItem) => {
    setEditingItem(menuItem);
    setFormData({
      name: menuItem.name || '',
      description: menuItem.description || '',
      price: menuItem.price ?? 0,
      category: menuItem.category || 'main',
      is_available: Boolean(menuItem.is_available),
      preparation_time: menuItem.preparation_time ?? 15,
      allergens: menuItem.allergens && menuItem.allergens.length > 0 ? menuItem.allergens.join(', ') : '',
      nutritional_info: {
        calories: menuItem.nutritional_info?.calories ?? '',
        protein: menuItem.nutritional_info?.protein ?? '',
        carbs: menuItem.nutritional_info?.carbs ?? '',
        fat: menuItem.nutritional_info?.fat ?? ''
      }
    });
    setShowAddForm(true);
  };

  const handleDelete = async (menuItem) => {
    const confirmed = window.confirm(`Eliminare definitivamente "${menuItem.name}" dal menu?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteMenuItem(menuItem.id);
      if (editingItem?.id === menuItem.id) {
        resetForm();
      }
      await loadData();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Errore durante l\'eliminazione del piatto');
    }
  };

  const handleToggleAvailability = async (menuItem) => {
    const desiredAvailability = !menuItem.is_available;
    try {
      const updatedItem = await updateMenuItem(menuItem.id, { is_available: desiredAvailability });
      setMenuItems(prev => prev.map(item => item.id === menuItem.id ? { ...item, ...(updatedItem || {}), is_available: desiredAvailability } : item));
      if (editingItem?.id === menuItem.id) {
        setFormData(prev => ({ ...prev, is_available: desiredAvailability }));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Errore nell\'aggiornamento della disponibilità');
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
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setEditingItem(null);
              setFormData(getInitialFormState());
              setShowAddForm(true);
            }
          }}
          style={{
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? (editingItem ? 'Annulla Modifica' : 'Annulla') : 'Aggiungi Piatto'}
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
          <h3>{editingItem ? `Modifica: ${editingItem.name}` : 'Nuovo Piatto'}</h3>
          
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

          <div style={{ marginBottom: '15px' }}>
            <AvailabilityToggle
              id={editingItem ? `menu-availability-${editingItem.id}` : 'menu-availability-new'}
              checked={formData.is_available}
              onChange={handleInputChange}
              labelOn="Disponibile per gli ordini"
              labelOff="Non disponibile"
            />
          </div>

          {/* Ingredient Selection Note */}
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            fontSize: '0.9em'
          }}>
            <strong>📝 Nota:</strong> Imposta la disponibilità del piatto con l'interruttore qui sopra.
            La gestione dettagliata degli ingredienti può essere effettuata separatamente tramite API dedicate.
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
              {editingItem ? 'Salva Modifiche' : 'Salva Piatto'}
            </button>
            <button type="button" onClick={resetForm} style={{
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
                  <th style={{ padding: '8px', textAlign: 'left' }}>Azioni</th>
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
                      <AvailabilityToggle
                        id={`availability-${item.id}`}
                        checked={item.is_available}
                        onChange={() => handleToggleAvailability(item)}
                        labelOn="Disponibile"
                        labelOff="Non disponibile"
                      />
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
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          backgroundColor: '#0984e3',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em',
                          marginRight: '8px'
                        }}
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        style={{
                          backgroundColor: '#d63031',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                      >
                        Elimina
                      </button>
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

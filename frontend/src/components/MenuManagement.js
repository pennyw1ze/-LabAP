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
  labelOff = 'Non disponibile',
  disabled = false
}) => (
  <label className={`availability-toggle ${disabled ? 'availability-toggle--loading' : ''}`}>
    <input
      id={id}
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <span className="availability-toggle__slider" aria-hidden="true" />
    <span className="availability-toggle__label">
      {disabled ? 'Aggiornando...' : (checked ? labelOn : labelOff)}
    </span>
  </label>
);

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(getInitialFormState());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [togglingItems, setTogglingItems] = useState(new Set());

  const categories = ['all', 'appetizer', 'main', 'dessert', 'beverage', 'side'];
  const categoryLabels = {
    all: 'Tutti',
    appetizer: 'Antipasti',
    main: 'Primi Piatti',
    dessert: 'Dolci',
    beverage: 'Bevande',
    side: 'Contorni'
  };

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
        allergens: formData.allergens && String(formData.allergens).trim() ? String(formData.allergens).split(',').map(a => a.trim()).filter(a => a.length > 0) : [],
        nutritional_info: {
          calories: formData.nutritional_info.calories && String(formData.nutritional_info.calories).trim() ? parseInt(String(formData.nutritional_info.calories).trim(), 10) : null,
          protein: formData.nutritional_info.protein && String(formData.nutritional_info.protein).trim() ? parseFloat(String(formData.nutritional_info.protein).trim()) : null,
          carbs: formData.nutritional_info.carbs && String(formData.nutritional_info.carbs).trim() ? parseFloat(String(formData.nutritional_info.carbs).trim()) : null,
          fat: formData.nutritional_info.fat && String(formData.nutritional_info.fat).trim() ? parseFloat(String(formData.nutritional_info.fat).trim()) : null,
        }
      };

      if (editingItem) {
        // Aggiorna il piatto esistente
        await updateMenuItem(editingItem.id, menuItemData);
        await loadData();
      } else {
        // Crea un nuovo piatto
        await createMenuItem(menuItemData);
        await loadData();
      }

      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      
      // Prova a estrarre un messaggio di errore più specifico
      let errorMessage = 'Errore nel salvataggio del piatto';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
        calories: menuItem.nutritional_info?.calories ? String(menuItem.nutritional_info.calories) : '',
        protein: menuItem.nutritional_info?.protein ? String(menuItem.nutritional_info.protein) : '',
        carbs: menuItem.nutritional_info?.carbs ? String(menuItem.nutritional_info.carbs) : '',
        fat: menuItem.nutritional_info?.fat ? String(menuItem.nutritional_info.fat) : ''
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
      alert("Errore durante l'eliminazione del piatto");
    }
  };

  const handleToggleAvailability = async (menuItem) => {
    const desiredAvailability = !menuItem.is_available;
    
    // Aggiunge l'item alla lista dei toggle in corso
    setTogglingItems(prev => new Set(prev.add(menuItem.id)));
    
    // Aggiornamento ottimistico: aggiorniamo subito l'UI locale
    setMenuItems(prevItems => 
      prevItems.map(item => 
        item.id === menuItem.id 
          ? { ...item, is_available: desiredAvailability }
          : item
      )
    );
    
    try {
      // Aggiorna il database
      await updateMenuItem(menuItem.id, {
        is_available: desiredAvailability
      });
      
      // Se stavamo modificando questo piatto, aggiorniamo anche il form
      if (editingItem?.id === menuItem.id) {
        setFormData(prev => ({
          ...prev,
          is_available: desiredAvailability
        }));
      }
      
    } catch (error) {
      console.error('Error updating availability:', error);
      
      // Ripristiniamo lo stato precedente in caso di errore
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === menuItem.id 
            ? { ...item, is_available: !desiredAvailability }
            : item
        )
      );
      
      alert("Errore nell'aggiornamento della disponibilità");
    } finally {
      // Rimuove l'item dalla lista dei toggle in corso
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(menuItem.id);
        return newSet;
      });
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

  const renderNutritionalFields = () => (
    <div className="menu-management__nutrition-grid">
      {['calories', 'protein', 'carbs', 'fat'].map((field) => (
        <div key={field} className="form-field">
          <label className="form-label" htmlFor={`nutritional-${field}`}>
            {field === 'calories' ? 'Calorie (kcal)' : `${field.charAt(0).toUpperCase()}${field.slice(1)} (g)`}
          </label>
          <input
            id={`nutritional-${field}`}
            type="number"
            className="input-glass"
            name={`nutritional_info.${field}`}
            value={formData.nutritional_info[field]}
            onChange={handleInputChange}
            min="0"
            step={field === 'calories' ? '1' : '0.1'}
          />
        </div>
      ))}
    </div>
  );

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return <div className="glass-card loading-panel">Caricamento dati menu...</div>;
  }

  return (
    <div className="menu-management menu-management--legacy">
      <section className="menu-management__panel menu-management__panel--legacy">
        <div className="menu-management__header">
          <div>
            <h2>🛠️ Gestione Menu</h2>
          </div>
          <div className="menu-management__filters">
            <button
              type="button"
              className="button-glass button-glass--primary"
              onClick={() => {
                if (showAddForm) {
                  resetForm();
                } else {
                  setEditingItem(null);
                  setFormData(getInitialFormState());
                  setShowAddForm(true);
                }
              }}
            >
              {showAddForm ? (editingItem ? 'Annulla modifica' : 'Annulla') : '➕ Nuovo Piatto'}
            </button>
            <button type="button" className="button-glass" onClick={loadData}>
              🔄 Aggiorna
            </button>
          </div>
        </div>

        {showAddForm && (
          <form className="menu-management__form" onSubmit={handleSubmit}>
            <h3 className="menu-management__form-title">
              {editingItem ? `✏️ Modifica: ${editingItem.name}` : '➕ Nuovo Piatto'}
            </h3>

            <div className="menu-management__form-grid menu-management__form-grid--split">
              <div className="form-field">
                <label className="form-label" htmlFor="name">Nome</label>
                <input
                  id="name"
                  name="name"
                  className="input-glass"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="category">Categoria</label>
                <select
                  id="category"
                  name="category"
                  className="select-glass"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.filter(category => category !== 'all').map(category => (
                    <option key={category} value={category}>{categoryLabels[category]}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="price">Prezzo (€)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-glass"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="preparation_time">Preparazione (min)</label>
                <input
                  id="preparation_time"
                  name="preparation_time"
                  type="number"
                  min="1"
                  className="input-glass"
                  value={formData.preparation_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="description">Descrizione</label>
              <textarea
                id="description"
                name="description"
                className="textarea-glass menu-management__textarea"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="allergens">Allergeni (separati da virgola)</label>
              <input
                id="allergens"
                name="allergens"
                className="input-glass"
                value={formData.allergens}
                onChange={handleInputChange}
              />
            </div>

            {renderNutritionalFields()}

            <div className="menu-management__form-row">
              <strong className="text-muted">Disponibilità</strong>
              <AvailabilityToggle
                id="form-availability"
                checked={formData.is_available}
                onChange={handleInputChange}
              />
            </div>

            <div className="menu-management__form-actions">
              <button type="submit" className="button-glass button-glass--primary menu-management__submit">
                {editingItem ? 'Salva Modifiche' : 'Salva Piatto'}
              </button>
              <button type="button" className="button-glass" onClick={resetForm}>
                Annulla
              </button>
            </div>
          </form>
        )}

      </section>

      <section className="menu-management__panel menu-management__panel--legacy">
        <div className="menu-management__list-header">
          <h3>Piatti attuali ({menuItems.length})</h3>
          <div className="menu-management__category-filters">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={`button-glass menu-management__category-button ${selectedCategory === category ? 'button-glass--primary' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </div>

        {menuItems.length === 0 ? (
          <div className="empty-state">Nessun piatto presente. Aggiungi il primo elemento per iniziare.</div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="empty-state">
            Nessun piatto nella categoria "{categoryLabels[selectedCategory]}".
          </div>
        ) : (
          <div className="menu-management__table-wrap">
            <table className="menu-management__table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Prezzo</th>
                  <th>Prep.</th>
                  <th>Disponibilità</th>
                  <th>Allergeni</th>
                  <th className="menu-management__table-actions">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenuItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="menu-management__table-name">
                        <strong>{item.name}</strong>
                        {item.description && <span className="text-muted">{item.description}</span>}
                      </div>
                    </td>
                    <td className="menu-management__table-category">{categoryLabels[item.category] || item.category}</td>
                    <td className="menu-management__table-price">€{item.price}</td>
                    <td>{item.preparation_time} min</td>
                    <td>
                      <AvailabilityToggle
                        id={`availability-${item.id}`}
                        checked={Boolean(item.is_available)}
                        onChange={() => handleToggleAvailability(item)}
                        disabled={togglingItems.has(item.id)}
                      />
                    </td>
                    <td>
                      {item.allergens && item.allergens.length > 0 ? (
                        <span className="menu-management__table-allergens">{item.allergens.join(', ')}</span>
                      ) : (
                        <span className="text-muted">Nessuno</span>
                      )}
                    </td>
                    <td>
                      <div className="menu-management__table-buttons">
                        <button
                          type="button"
                          className="button-glass"
                          onClick={() => handleEdit(item)}
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          type="button"
                          className="button-glass button-glass--danger"
                          onClick={() => handleDelete(item)}
                        >
                          🗑️ Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

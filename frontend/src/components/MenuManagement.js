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

  const renderNutritionalFields = () => (
    <div className="menu-management__form-grid">
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
          />
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="glass-card loading-panel">Caricamento dati menu...</div>;
  }

  return (
    <div className="menu-management">
      <section className="menu-management__panel">
        <div className="menu-management__header">
          <div>
            <h2>🛠️ Gestione Menu</h2>
            <span className="text-muted">Modifica, aggiorna e mantieni il menu con uno stile trasparente.</span>
          </div>
          <div className="menu-management__filters">
            <button
              type="button"
              className="button-glass button-glass--primary"
              onClick={() => {
                setShowAddForm(true);
                setEditingItem(null);
                setFormData(getInitialFormState());
              }}
            >
              ➕ Nuovo Piatto
            </button>
            <button type="button" className="button-glass" onClick={loadData}>
              🔄 Aggiorna
            </button>
          </div>
        </div>

        <div className="menu-management__items">
          {menuItems.length === 0 ? (
            <div className="empty-state">Nessun piatto presente. Aggiungi il primo elemento per iniziare.</div>
          ) : (
            menuItems.map((item) => (
              <article key={item.id} className="menu-management__item">
                <div className="menu-management__item-header">
                  <div>
                    <h3>{item.name}</h3>
                    {item.description && <p className="text-muted">{item.description}</p>}
                  </div>
                  <div className="menu-display__price">
                    <div>€{item.price}</div>
                    <small className="text-muted">{item.category}</small>
                  </div>
                </div>

                <div className="menu-management__item-meta">
                  <span>⏱️ {item.preparation_time} min</span>
                  {item.allergens && item.allergens.length > 0 && (
                    <span className="glass-chip">⚠️ Allergeni: {item.allergens.join(', ')}</span>
                  )}
                  <AvailabilityToggle
                    id={`availability-${item.id}`}
                    checked={Boolean(item.is_available)}
                    labelOn="Disponibile"
                    labelOff="Non disp."
                    onChange={() => handleToggleAvailability(item)}
                  />
                </div>

                {item.nutritional_info && (
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {item.nutritional_info.calories && <span>🔥 {item.nutritional_info.calories} kcal</span>}
                    {item.nutritional_info.protein && <span style={{ marginLeft: '12px' }}>💪 {item.nutritional_info.protein} g proteine</span>}
                    {item.nutritional_info.carbs && <span style={{ marginLeft: '12px' }}>🌾 {item.nutritional_info.carbs} g carboidrati</span>}
                    {item.nutritional_info.fat && <span style={{ marginLeft: '12px' }}>🥑 {item.nutritional_info.fat} g grassi</span>}
                  </div>
                )}

                <div className="menu-management__item-actions">
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
                  <button
                    type="button"
                    className={`button-glass ${item.is_available ? 'button-glass--danger' : 'button-glass--success'}`}
                    onClick={() => handleToggleAvailability(item)}
                  >
                    {item.is_available ? 'Sospendi' : 'Rendi disponibile'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <aside className="menu-management__panel">
        <div className="menu-management__header">
          <div>
            <h3>{editingItem ? '✏️ Modifica Piatto' : '➕ Nuovo Piatto'}</h3>
            <span className="text-muted">
              {editingItem ? 'Aggiorna le informazioni del piatto selezionato.' : 'Compila il modulo per aggiungere un nuovo piatto al menu.'}
            </span>
          </div>
          {(showAddForm || editingItem) && (
            <button type="button" className="button-glass" onClick={resetForm}>
              Annulla
            </button>
          )}
        </div>

        {showAddForm || editingItem ? (
          <form className="menu-management__form" onSubmit={handleSubmit}>
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
              <label className="form-label" htmlFor="description">Descrizione</label>
              <textarea
                id="description"
                name="description"
                className="textarea-glass menu-management__textarea"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="menu-management__form-grid">
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
                <label className="form-label" htmlFor="category">Categoria</label>
                <select
                  id="category"
                  name="category"
                  className="select-glass"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="appetizer">Antipasto</option>
                  <option value="main">Piatto Principale</option>
                  <option value="dessert">Dessert</option>
                  <option value="beverage">Bevanda</option>
                  <option value="side">Contorno</option>
                </select>
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

              <div className="form-field">
                <label className="form-label" htmlFor="allergens">Allergeni (comma separated)</label>
                <input
                  id="allergens"
                  name="allergens"
                  className="input-glass"
                  value={formData.allergens}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <strong className="text-muted">Disponibilità</strong>
              <AvailabilityToggle
                id="form-availability"
                checked={formData.is_available}
                onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
              />
            </div>

            <div>
              <strong className="text-muted">Informazioni Nutrizionali</strong>
              {renderNutritionalFields()}
            </div>

            <button
              type="submit"
              className="button-glass button-glass--success menu-management__submit"
            >
              {editingItem ? '💾 Aggiorna Piatto' : '🚀 Aggiungi al Menu'}
            </button>
          </form>
        ) : (
          <div className="empty-state">
            Seleziona un piatto da modificare oppure crea un nuovo piatto per iniziare.
          </div>
        )}
      </aside>
    </div>
  );
}

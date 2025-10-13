import React, { useState, useEffect } from 'react';
import { getMenu } from '../api';

export default function MenuDisplay() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const menuData = await getMenu();
      setMenuItems(menuData);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
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
    <div className="menu-display">
      <div className="menu-display__header">
        <div>
          <h2>🍽️ Menu del Ristorante</h2>
        </div>
        <button type="button" className="button-glass button-glass--primary" onClick={loadMenuData}>
          🔄 Aggiorna Menu
        </button>
      </div>

      <section className="menu-display__filters">
        <h3>Filtra per categoria</h3>
        <div className="menu-display__categories">
          {categories.map(category => (
            <button
              key={category}
              type="button"
              className={`button-glass menu-display__category-button ${selectedCategory === category ? 'button-glass--primary' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </section>

      <section>
        {filteredMenuItems.length === 0 ? (
          <div className="empty-state">
            {menuItems.length === 0
              ? 'Nessun piatto disponibile. Aggiungi articoli al menu dal backend.'
              : `Nessun piatto nella categoria "${categoryLabels[selectedCategory]}".`}
          </div>
        ) : (
          <div className="menu-display__grid">
            {filteredMenuItems.map((item) => (
              <article key={item.id} className="menu-display__card">
                <div className="menu-display__card-header">
                  <div>
                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                    {!item.is_available && (
                      <span className="overdue">(Non Disponibile)</span>
                    )}
                  </div>
                  <div className="menu-display__price">
                    <div>€{item.price}</div>
                    <small className="text-muted">{categoryLabels[item.category]}</small>
                  </div>
                </div>

                {item.description && (
                  <p className="text-muted" style={{ fontStyle: 'italic' }}>
                    {item.description}
                  </p>
                )}

                <div className="menu-display__meta">
                  <span>⏱️ {item.preparation_time} min</span>
                  <span className={item.is_available ? 'chip-positive' : 'overdue'}>
                    {item.is_available ? '✅ Disponibile' : '❌ Non Disponibile'}
                  </span>
                </div>

                {item.allergens && item.allergens.length > 0 && (
                  <div className="glass-chip" style={{ alignSelf: 'flex-start' }}>
                    ⚠️ Allergeni: {item.allergens.join(', ')}
                  </div>
                )}

                {item.nutritional_info && (
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {item.nutritional_info.calories && (
                      <span>🔥 {item.nutritional_info.calories} kcal</span>
                    )}
                    {item.nutritional_info.protein && (
                      <span style={{ marginLeft: '12px' }}>💪 Proteine: {item.nutritional_info.protein}g</span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="menu-display__stats">
        <h3>Statistiche Menu</h3>
        <div className="menu-display__stats-grid">
          <div className="menu-display__stats-card">
            <div className="menu-display__stats-value">{menuItems.length}</div>
            <div className="menu-display__stats-label">Piatti Totali</div>
          </div>
          <div className="menu-display__stats-card">
            <div className="menu-display__stats-value">{menuItems.filter(item => item.is_available).length}</div>
            <div className="menu-display__stats-label">Disponibili</div>
          </div>
          <div className="menu-display__stats-card">
            <div className="menu-display__stats-value">{menuItems.filter(item => !item.is_available).length}</div>
            <div className="menu-display__stats-label">Non Disponibili</div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getMenu, getInventory } from '../api';

export default function MenuDisplay() {
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const [menuData, inventoryData] = await Promise.all([
        getMenu(),
        getInventory()
      ]);
      setMenuItems(menuData);
      setInventory(inventoryData);
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
    return <div>Caricamento menu...</div>;
  }

  return (
    <div>
      <h2>Menu del Ristorante</h2>

      {/* Category Filter */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Filtra per categoria:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                backgroundColor: selectedCategory === category ? '#0984e3' : '#ddd',
                color: selectedCategory === category ? 'white' : 'black',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {filteredMenuItems.length === 0 ? (
        <p>
          {menuItems.length === 0 
            ? 'Nessun piatto disponibile. Aggiungi degli articoli al menu dal backend.'
            : `Nessun piatto nella categoria "${categoryLabels[selectedCategory]}".`
          }
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredMenuItems.map((item) => (
            <div 
              key={item.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: item.is_available ? 'white' : '#f8f8f8',
                opacity: item.is_available ? 1 : 0.7
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: item.is_available ? 'black' : '#666' }}>
                  {item.name}
                  {!item.is_available && <span style={{ color: '#d63031', marginLeft: '8px' }}>(Non Disponibile)</span>}
                </h3>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.2em', 
                    fontWeight: 'bold', 
                    color: '#0984e3' 
                  }}>
                    €{item.price}
                  </div>
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#666',
                    textTransform: 'capitalize'
                  }}>
                    {categoryLabels[item.category]}
                  </div>
                </div>
              </div>
              
              {item.description && (
                <p style={{ 
                  margin: '8px 0', 
                  color: '#666', 
                  fontStyle: 'italic' 
                }}>
                  {item.description}
                </p>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '12px',
                fontSize: '0.9em'
              }}>
                <span style={{ color: '#666' }}>
                  ⏱️ {item.preparation_time} min
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.is_available ? (
                    <span style={{ color: '#00b894', fontWeight: 'bold' }}>✅ Disponibile</span>
                  ) : (
                    <span style={{ color: '#d63031', fontWeight: 'bold' }}>❌ Non Disponibile</span>
                  )}
                </div>
              </div>

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <small style={{ color: '#e17000', fontWeight: 'bold' }}>
                    ⚠️ Allergeni: {item.allergens.join(', ')}
                  </small>
                </div>
              )}

              {/* Nutritional Info */}
              {item.nutritional_info && (
                <div style={{ marginTop: '8px', fontSize: '0.8em', color: '#666' }}>
                  {item.nutritional_info.calories && (
                    <span>🔥 {item.nutritional_info.calories} kcal</span>
                  )}
                  {item.nutritional_info.protein && (
                    <span style={{ marginLeft: '12px' }}>💪 Proteine: {item.nutritional_info.protein}g</span>
                  )}
                </div>
              )}

              {/* Note per la connessione agli ingredienti */}
              <div style={{ 
                marginTop: '12px', 
                padding: '8px', 
                backgroundColor: '#f0f8ff', 
                borderRadius: '4px',
                fontSize: '0.8em',
                color: '#666'
              }}>
                <strong>📝 Nota:</strong> La connessione con gli ingredienti dell'inventory 
                richiede l'implementazione della tabella di associazione many-to-many nel backend. 
                Attualmente visualizziamo solo i dati base del menu.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div style={{ 
        marginTop: '30px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3>Statistiche Menu</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0984e3' }}>
              {menuItems.length}
            </div>
            <div style={{ color: '#666' }}>Piatti Totali</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#00b894' }}>
              {menuItems.filter(item => item.is_available).length}
            </div>
            <div style={{ color: '#666' }}>Disponibili</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#d63031' }}>
              {menuItems.filter(item => !item.is_available).length}
            </div>
            <div style={{ color: '#666' }}>Non Disponibili</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#e17000' }}>
              {inventory.length}
            </div>
            <div style={{ color: '#666' }}>Ingredienti</div>
          </div>
        </div>
      </div>
    </div>
  );
}
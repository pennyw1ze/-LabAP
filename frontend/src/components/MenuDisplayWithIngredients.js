// byteristo-frontend/src/components/MenuDisplayWithIngredients.js
import React, { useState, useEffect } from 'react';
import { getMenu, getMenuIngredients } from '../api';

export default function MenuDisplayWithIngredients() {
  const [menuItems, setMenuItems] = useState([]);
  const [menuIngredients, setMenuIngredients] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showIngredients, setShowIngredients] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const menuData = await getMenu();
      setMenuItems(menuData);

      // Load ingredients for each menu item
      const ingredientsPromises = menuData.map(async (item) => {
        const ingredients = await getMenuIngredients(item.id);
        return { menuId: item.id, ingredients };
      });

      const ingredientsResults = await Promise.all(ingredientsPromises);
      const ingredientsMap = {};
      ingredientsResults.forEach(result => {
        if (result.ingredients) {
          ingredientsMap[result.menuId] = result.ingredients;
        }
      });
      setMenuIngredients(ingredientsMap);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredients = (menuId) => {
    setShowIngredients(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
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
    return <div>Caricamento menu e ingredienti...</div>;
  }

  return (
    <div>
      <h2>Menu Completo con Ingredienti</h2>

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
            ? 'Nessun piatto disponibile nel menu.'
            : `Nessun piatto nella categoria "${categoryLabels[selectedCategory]}".`
          }
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredMenuItems.map((item) => {
            const ingredients = menuIngredients[item.id];
            const isVisible = Boolean(item.is_available);

            return (
              <div 
                key={item.id} 
                style={{ 
                  border: '1px solid transparent',
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: isVisible ? 'white' : '#fff4e6',
                  borderColor: isVisible ? '#4caf50' : '#ff9f43'
                }}
              >
                {/* Menu Item Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: isVisible ? '#1e272e' : '#d35400' }}>
                      {item.name}
                    </h3>
                    <div style={{ 
                      fontSize: '0.9em', 
                      color: '#666',
                      textTransform: 'capitalize',
                      marginTop: '4px'
                    }}>
                      {categoryLabels[item.category]}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.3em', 
                      fontWeight: 'bold', 
                      color: '#0984e3' 
                    }}>
                      €{item.price}
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                      ⏱️ {item.preparation_time} min
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

                {/* Availability Status */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px',
                  fontSize: '0.9em'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: isVisible ? '#4caf50' : '#ff9f43', fontWeight: 'bold' }}>
                      {isVisible ? '✅ Visibile per gli ordini' : '⏸️ Temporaneamente nascosto'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => toggleIngredients(item.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #0984e3',
                      color: '#0984e3',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8em'
                    }}
                  >
                    {showIngredients[item.id] ? 'Nascondi Ingredienti' : 'Mostra Ingredienti'}
                  </button>
                </div>

                {/* Ingredients Details */}
                {showIngredients[item.id] && (
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '6px',
                    marginTop: '12px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🥘 Ingredienti Richiesti:</h4>
                    
                    {ingredients && ingredients.ingredients && ingredients.ingredients.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                        {ingredients.ingredients.map((ing, index) => {
                          const inventoryItem = ing.inventory_item || {};
                          const ingredientName = inventoryItem.name || ing.name || `Ingrediente ${index + 1}`;

                          return (
                            <div 
                              key={index}
                              style={{ 
                                backgroundColor: '#ffffff',
                                border: '1px solid #dfe6e9',
                                borderRadius: '4px',
                                padding: '10px',
                                fontSize: '0.9em'
                              }}
                            >
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {ingredientName}
                              </div>
                              <div style={{ color: '#666', fontSize: '0.8em' }}>
                                Quantità per porzione: <strong>{ing.quantity} {ing.unit}</strong>
                              </div>
                              {inventoryItem.supplier && (
                                <div style={{ color: '#666', fontSize: '0.75em', marginTop: '4px' }}>
                                  Fornitore: {inventoryItem.supplier}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>
                        Nessun ingrediente configurato per questo piatto.
                        <br />
                        <small>Gestisci gli ingredienti dalla sezione "Gestione Menu".</small>
                      </p>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8em' }}>
                  {item.allergens && item.allergens.length > 0 && (
                    <div style={{ color: '#e17000' }}>
                      <strong>⚠️ Allergeni:</strong> {item.allergens.join(', ')}
                    </div>
                  )}
                  
                  {item.nutritional_info && (
                    <div style={{ color: '#666' }}>
                      {item.nutritional_info.calories && <span>🔥 {item.nutritional_info.calories} kcal</span>}
                      {item.nutritional_info.protein && <span style={{ marginLeft: '8px' }}>💪 {item.nutritional_info.protein}g proteine</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistics */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3>📈 Statistiche Menu</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#0984e3' }}>
              {menuItems.length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Piatti Totali</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#4caf50' }}>
              {menuItems.filter(item => item.is_available).length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Visibili ai camerieri</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#ff9f43' }}>
              {menuItems.filter(item => !item.is_available).length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Temporaneamente nascosti</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#9c27b0' }}>
              {Object.keys(menuIngredients).reduce((total, menuId) => {
                const ingredients = menuIngredients[menuId];
                return total + (ingredients?.ingredients?.length || 0);
              }, 0)}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Ingredienti associati</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666', textAlign: 'center' }}>
        🔄 I dati vengono aggiornati automaticamente dal microservizio menu-inventory
      </div>
    </div>
  );
}

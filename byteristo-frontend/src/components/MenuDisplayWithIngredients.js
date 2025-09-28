// byteristo-frontend/src/components/MenuDisplayWithIngredients.js
import React, { useState, useEffect } from 'react';
import { getMenu, getInventory, getMenuIngredients, checkMenuAvailability } from '../api';

export default function MenuDisplayWithIngredients() {
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [menuIngredients, setMenuIngredients] = useState({});
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showIngredients, setShowIngredients] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [menuData, inventoryData] = await Promise.all([
        getMenu(),
        getInventory()
      ]);
      
      setMenuItems(menuData);
      setInventory(inventoryData);

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

      // Check availability
      if (menuData.length > 0) {
        const availability = await checkMenuAvailability(menuData.map(item => item.id));
        setAvailabilityData(availability);
      }

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

  const getAvailabilityForItem = (menuId) => {
    return availabilityData.find(item => item.menu_item.id === menuId);
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

      {/* Availability Summary */}
      {availabilityData.length > 0 && (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #4caf50', 
          borderRadius: '4px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h3>📊 Riepilogo Disponibilità</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: '#4caf50' }}>
                ✅ {availabilityData.filter(item => item.can_prepare).length} piatti preparabili
              </strong>
            </div>
            <div>
              <strong style={{ color: '#f44336' }}>
                ❌ {availabilityData.filter(item => !item.can_prepare).length} piatti non disponibili
              </strong>
            </div>
          </div>
        </div>
      )}

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
            const availability = getAvailabilityForItem(item.id);
            const ingredients = menuIngredients[item.id];

            return (
              <div 
                key={item.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: availability?.can_prepare ? 'white' : '#fff3e0',
                  borderColor: availability?.can_prepare ? '#4caf50' : '#ff9800'
                }}
              >
                {/* Menu Item Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: availability?.can_prepare ? 'black' : '#e65100' }}>
                      {item.name}
                      {!availability?.can_prepare && (
                        <span style={{ color: '#f44336', marginLeft: '8px', fontSize: '0.8em' }}>
                          (Ingredienti insufficienti)
                        </span>
                      )}
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
                    {availability?.can_prepare ? (
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ Preparabile</span>
                    ) : (
                      <span style={{ color: '#f44336', fontWeight: 'bold' }}>❌ Non preparabile</span>
                    )}
                    {item.is_available ? (
                      <span style={{ color: '#4caf50' }}>📋 Nel menu</span>
                    ) : (
                      <span style={{ color: '#ff9800' }}>📋 Temporaneamente rimosso</span>
                    )}
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
                          const inventoryItem = ing.inventory_item;
                          const hasEnough = inventoryItem.current_stock >= ing.quantity;
                          
                          return (
                            <div 
                              key={index}
                              style={{ 
                                backgroundColor: hasEnough ? '#e8f5e8' : '#ffebee',
                                border: `1px solid ${hasEnough ? '#4caf50' : '#f44336'}`,
                                borderRadius: '4px',
                                padding: '10px',
                                fontSize: '0.9em'
                              }}
                            >
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {inventoryItem.name}
                              </div>
                              <div style={{ color: '#666', fontSize: '0.8em' }}>
                                Richiesto: <strong>{ing.quantity} {ing.unit}</strong>
                              </div>
                              <div style={{ color: '#666', fontSize: '0.8em' }}>
                                Disponibile: <strong style={{ color: hasEnough ? '#4caf50' : '#f44336' }}>
                                  {inventoryItem.current_stock} {inventoryItem.unit}
                                </strong>
                              </div>
                              {!hasEnough && (
                                <div style={{ color: '#f44336', fontSize: '0.8em', marginTop: '4px' }}>
                                  ⚠️ Mancano {(ing.quantity - inventoryItem.current_stock).toFixed(2)} {ing.unit}
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
                        <small>Vai alla sezione "Gestione Menu" per aggiungere ingredienti.</small>
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
        <h3>📈 Statistiche Complete</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#0984e3' }}>
              {menuItems.length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Piatti Totali</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#4caf50' }}>
              {availabilityData.filter(item => item.can_prepare).length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Preparabili</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#f44336' }}>
              {availabilityData.filter(item => !item.can_prepare).length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Non Preparabili</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#ff9800' }}>
              {inventory.length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Ingredienti</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#9c27b0' }}>
              {Object.keys(menuIngredients).reduce((total, menuId) => {
                const ingredients = menuIngredients[menuId];
                return total + (ingredients?.ingredients?.length || 0);
              }, 0)}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Associazioni Ingredienti</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666', textAlign: 'center' }}>
        🔄 I dati vengono aggiornati automaticamente dal microservizio menu-inventory
      </div>
    </div>
  );
}
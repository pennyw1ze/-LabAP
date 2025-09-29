// Funzioni API per la gestione degli ordini

const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3002';

// Gestione errori API
const handleApiError = (error) => {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  throw new Error(error.message || 'Errore di comunicazione con il server');
};

// === ORDINI ===

export const getOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.table_number) params.append('table_number', filters.table_number);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateOrderItemStatus = async (orderId, itemId, status) => {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}/items/${itemId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getKitchenOrders = async () => {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders/kitchen`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getOrderAnalytics = async (dateFrom, dateTo) => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders/analytics?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// === MENU & INVENTORY (aggiorniamo le funzioni esistenti) ===

const MENU_INVENTORY_SERVICE_URL = process.env.REACT_APP_MENU_SERVICE_URL || 'http://localhost:3001';

export const getMenu = async () => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/menu`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getInventory = async () => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/inventory`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getInventoryAlerts = async () => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/inventory/alerts`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.summary; // Ritorniamo il summary per facilità
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createMenuItem = async (menuItemData) => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(menuItemData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createInventoryItem = async (inventoryItemData) => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryItemData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const adjustInventoryStock = async (itemId, adjustment) => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/inventory/${itemId}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adjustment }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getMenuIngredients = async (menuId) => {
  try {
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/menu/${menuId}/ingredients`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkMenuAvailability = async (menuItemIds = []) => {
  try {
    const requestBody = menuItemIds.length > 0 ? { menu_item_ids: menuItemIds } : {};
    
    const response = await fetch(`${MENU_INVENTORY_SERVICE_URL}/api/menu/check-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// === FUNZIONI DI UTILITÀ ===

export const formatOrderStatus = (status) => {
  const statusLabels = {
    'pending': 'In Attesa',
    'confirmed': 'Confermato',
    'preparing': 'In Preparazione',
    'ready': 'Pronto',
    'delivered': 'Consegnato',
    'cancelled': 'Annullato'
  };
  
  return statusLabels[status] || status;
};

export const formatOrderType = (type) => {
  const typeLabels = {
    'dine_in': 'Al Tavolo',
    'takeout': 'Da Asporto',
    'delivery': 'Consegna'
  };
  
  return typeLabels[type] || type;
};

export const calculateOrderTiming = (createdAt, estimatedCompletion) => {
  const now = new Date();
  const created = new Date(createdAt);
  const elapsed = Math.floor((now - created) / (1000 * 60)); // minuti trascorsi
  
  let estimatedRemaining = null;
  if (estimatedCompletion) {
    const estimated = new Date(estimatedCompletion);
    estimatedRemaining = Math.floor((estimated - now) / (1000 * 60));
  }
  
  return {
    elapsedMinutes: elapsed,
    estimatedRemainingMinutes: estimatedRemaining,
    isOverdue: estimatedRemaining !== null && estimatedRemaining < 0
  };
};

// === INVENTORY INTEGRATION ===

// Funzione per ridurre automaticamente l'inventory quando un ordine viene confermato
export const processInventoryReduction = async (orderItems) => {
  // Questa funzione dovrebbe essere chiamata dal backend quando un ordine viene confermato
  // Per ora è solo un placeholder che mostra la logica
  
  const reductionPromises = orderItems.map(async (orderItem) => {
    try {
      // Per ogni item dell'ordine, otteniamo gli ingredienti necessari
      const menuIngredients = await getMenuIngredients(orderItem.menu_item_id);
      
      // Per ogni ingrediente, riduciamo lo stock
      const adjustmentPromises = menuIngredients.ingredients.map(async (ingredient) => {
        const requiredQuantity = ingredient.quantity * orderItem.quantity;
        const adjustment = -requiredQuantity; // Negativo per ridurre
        
        return adjustInventoryStock(ingredient.inventory_item.id, adjustment);
      });
      
      await Promise.all(adjustmentPromises);
    } catch (error) {
      console.error(`Errore nel ridurre inventory per ${orderItem.menu_item_name}:`, error);
      throw error;
    }
  });
  
  await Promise.all(reductionPromises);
};

// Export per compatibilità con il codice esistente
export {
  getOrders as getBills, // Alias per compatibilità
  getOrderAnalytics as getAnalytics, // Alias per compatibilità
};
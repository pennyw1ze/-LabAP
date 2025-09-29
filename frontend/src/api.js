const API_BASE = "http://localhost:3001/api"; // Porta corretta del microservizio

// --- Menu & Inventory ---
export async function getMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu/`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching menu:', error);
    return [];
  }
}

export async function getMenuItemById(id) {
  try {
    const res = await fetch(`${API_BASE}/menu/${id}`);
    if (!res.ok) throw new Error('Failed to fetch menu item');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
}

export async function createMenuItem(menuData) {
  try {
    const res = await fetch(`${API_BASE}/menu/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuData),
    });
    if (!res.ok) throw new Error('Failed to create menu item');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

export async function updateMenuItem(menuId, updateData) {
  try {
    const res = await fetch(`${API_BASE}/menu/${menuId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update menu item');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

export async function deleteMenuItem(menuId) {
  try {
    const res = await fetch(`${API_BASE}/menu/${menuId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error('Failed to delete menu item');
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}

// --- Orders (placeholder for other microservices) ---
export async function getOrders() {
  // Placeholder - da implementare quando avrai il microservizio orders
  return [];
}

export async function createOrder(orderData) {
  // Placeholder - da implementare quando avrai il microservizio orders
  console.log('Order would be created:', orderData);
  return { id: 'temp-' + Date.now(), ...orderData, status: 'pending' };
}

// --- Payments (placeholder for other microservices) ---
export async function getPayments() {
  // Placeholder - da implementare quando avrai il microservizio payments
  return [];
}

export async function makePayment(paymentData) {
  // Placeholder - da implementare quando avrai il microservizio payments
  console.log('Payment would be processed:', paymentData);
  return { id: 'payment-' + Date.now(), ...paymentData, status: 'completed' };
}

// --- Bills (placeholder for other microservices) ---
export async function getBills() {
  // Placeholder - da implementare quando avrai il microservizio bills
  return [];
}

// --- Analytics (placeholder for other microservices) ---
export async function getAnalytics() {
  // Placeholder - da implementare quando avrai il microservizio analytics
  return { totalOrders: 0, totalRevenue: 0, popularItems: [] };
}
// byteristo-frontend/src/api.js - Add these functions to the existing file

// --- Menu-Ingredients Association Functions ---
export async function getMenuIngredients(menuId) {
  try {
    const res = await fetch(`${API_BASE}/menu/${menuId}/ingredients`);
    if (!res.ok) throw new Error('Failed to fetch menu ingredients');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching menu ingredients:', error);
    return null;
  }
}

export async function addIngredientToMenu(menuId, ingredientData) {
  try {
    const res = await fetch(`${API_BASE}/menu/${menuId}/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ingredientData),
    });
    if (!res.ok) throw new Error('Failed to add ingredient to menu');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error adding ingredient to menu:', error);
    throw error;
  }
}

export async function updateMenuIngredient(menuId, inventoryItemId, updateData) {
  try {
    const res = await fetch(`${API_BASE}/menu/${menuId}/ingredients/${inventoryItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error('Failed to update menu ingredient');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error updating menu ingredient:', error);
    throw error;
  }
}

export async function removeIngredientFromMenu(menuId, inventoryItemId) {
  try {
    const res = await fetch(`${API_BASE}/menu/${menuId}/ingredients/${inventoryItemId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error('Failed to remove ingredient from menu');
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Error removing ingredient from menu:', error);
    throw error;
  }
}

export async function checkMenuAvailability(menuItemIds = []) {
  console.warn('checkMenuAvailability is deprecated: availability is now managed manually.');
  return [];
}

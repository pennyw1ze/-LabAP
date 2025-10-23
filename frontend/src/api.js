const API_BASE = "http://localhost:3000/api"; // API Gateway

// --- Menu ---
export async function getMenu(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.category) {
      params.append('category', filters.category);
    }

    if (filters.available !== undefined) {
      params.append('available', filters.available ? 'true' : 'false');
    }

    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/menu/?${queryString}` : `${API_BASE}/menu/`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch menu');
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching menu:', error);
    return [];
  }
}

export async function createMenuItem(menuData) {
  try {
    const res = await fetch(`${API_BASE}/menu/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuData),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      const errorMessage = data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }
    
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
    
    const data = await res.json();
    
    if (!res.ok) {
      const errorMessage = data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }
    
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

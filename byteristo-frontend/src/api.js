const API_BASE = "http://localhost:3000/api";

// --- Menu & Inventory ---
export async function getMenu() {
  const res = await fetch(`${API_BASE}/menu`);
  return res.json();
}

// api.js
export async function fetchMenuItems() {
  try {
    const response = await fetch(`${API_BASE}/menu-items`);
    if (!response.ok) {
      throw new Error('Errore nel recupero degli articoli del menu');
    }
    return await response.json();
  } catch (error) {
    console.error('Errore:', error);
    return [];
  }
}

export async function getInventory() {
  const res = await fetch(`${API_BASE}/inventory`);
  return res.json();
}

// --- Orders ---
export async function getOrders() {
  const res = await fetch(`${API_BASE}/orders`);
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  return res.json();
}

// --- Payments ---
export async function getPayments() {
  const res = await fetch(`${API_BASE}/payments`);
  return res.json();
}

export async function makePayment(paymentData) {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  return res.json();
}

// --- Bills ---
export async function getBills() {
  const res = await fetch(`${API_BASE}/bills`);
  return res.json();
}

// --- Analytics ---
export async function getAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
}

const BILLING_SERVICE_URL = process.env.REACT_APP_BILLING_SERVICE_URL || 'http://localhost:3003';
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3002';

// === ORDERS (per billing) ===

export const getOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.table_number) params.append('table_number', filters.table_number);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const response = await fetch(`${ORDER_SERVICE_URL}/api/orders?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// === BILLS ===

export const getBills = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.table_number) params.append('table_number', filters.table_number);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const response = await fetch(`${BILLING_SERVICE_URL}/api/bills?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
};

export const getBillById = async (billId) => {
  try {
    const response = await fetch(`${BILLING_SERVICE_URL}/api/bills/${billId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    throw error;
  }
};

export const getBillByOrderId = async (orderId) => {
  try {
    const response = await fetch(`${BILLING_SERVICE_URL}/api/bills/order/${orderId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching bill by order:', error);
    throw error;
  }
};

export const createBill = async (billData) => {
  try {
    const response = await fetch(`${BILLING_SERVICE_URL}/api/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
  }
};

// === PAYMENTS ===

export const processPayment = async (paymentData) => {
  try {
    const response = await fetch(`${BILLING_SERVICE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

export const getPayments = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.bill_id) params.append('bill_id', filters.bill_id);
    if (filters.payment_method) params.append('payment_method', filters.payment_method);
    if (filters.status) params.append('status', filters.status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const response = await fetch(`${BILLING_SERVICE_URL}/api/payments?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const getPaymentById = async (paymentId) => {
  try {
    const response = await fetch(`${BILLING_SERVICE_URL}/api/payments/${paymentId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

// === REPORTS ===

export const getDailySummary = async (date) => {
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const response = await fetch(`${BILLING_SERVICE_URL}/api/reports/daily-summary?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    throw error;
  }
};

// === UTILITY FUNCTIONS ===

export const formatBillStatus = (status) => {
  const labels = {
    'pending': 'Da Pagare',
    'paid': 'Pagato',
    'partially_paid': 'Parzialmente Pagato',
    'refunded': 'Rimborsato',
    'cancelled': 'Annullato'
  };
  return labels[status] || status;
};

export const formatPaymentMethod = (method) => {
  const labels = {
    'cash': 'Contanti',
    'card': 'Carta',
    'digital_wallet': 'Portafoglio Digitale',
    'bank_transfer': 'Bonifico Bancario'
  };
  return labels[method] || method;
};

export const calculateBillTotals = (bill) => {
  const subtotal = parseFloat(bill.subtotal || 0);
  const tax = parseFloat(bill.tax_amount || 0);
  const tip = parseFloat(bill.tip_amount || 0);
  const discount = parseFloat(bill.discount_amount || 0);
  
  return {
    subtotal,
    tax,
    tip,
    discount,
    total: subtotal + tax + tip - discount,
    paid: parseFloat(bill.paid_amount || 0),
    remaining: parseFloat(bill.remaining_amount || 0)
  };
};

// Export default per compatibilità
export default {
  getOrders,
  getBills,
  getBillById,
  getBillByOrderId,
  createBill,
  processPayment,
  getPayments,
  getPaymentById,
  getDailySummary,
  formatBillStatus,
  formatPaymentMethod,
  calculateBillTotals
};
import React, { useState, useEffect } from 'react';
import { 
  getOrders, 
  getBills, 
  createBill, 
  processPayment, 
} from '../api/billingApi';

export default function BillingPayments() {
  const [readyOrders, setReadyOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // orders, bills, payment
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carica ordini pronti per il pagamento (ready o delivered)
      const ordersData = await getOrders({ status: 'ready' });
      const deliveredData = await getOrders({ status: 'delivered' });
      setReadyOrders([...ordersData, ...deliveredData]);

      // Carica tutti i bill
      const billsData = await getBills();
      setBills(billsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (order) => {
    try {
      const billData = {
        order_id: order.id,
        tip_amount: 0,
        discount_amount: 0
      };

      const newBill = await createBill(billData);
      alert(`Conto creato: ${newBill.bill_number}`);
      
      loadData();
      setSelectedBill(newBill);
      setActiveTab('payment');
      setPaymentForm(prev => ({ ...prev, amount: newBill.remaining_amount.toString() }));
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Errore nella creazione del conto: ' + error.message);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedBill) {
      alert('Selezionare un conto per procedere con il pagamento');
      return;
    }

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Inserire un importo valido');
      return;
    }

    try {
      const paymentData = {
        bill_id: selectedBill.id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || null
      };

      const result = await processPayment(paymentData);
      
      alert(`Pagamento elaborato con successo!\nNumero: ${result.payment.payment_number}`);
      
      // Reset form
      setPaymentForm({
        amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: ''
      });
      
      loadData();
      setActiveTab('bills');
      setSelectedBill(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Errore nell\'elaborazione del pagamento: ' + error.message);
    }
  };

  const handleSelectBillForPayment = (bill) => {
    setSelectedBill(bill);
    setPaymentForm(prev => ({ 
      ...prev, 
      amount: bill.remaining_amount.toString() 
    }));
    setActiveTab('payment');
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ff9800',
      'paid': '#4caf50',
      'partially_paid': '#2196f3',
      'refunded': '#9e9e9e',
      'cancelled': '#f44336'
    };
    return colors[status] || '#9e9e9e';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Da Pagare',
      'paid': 'Pagato',
      'partially_paid': 'Parzialmente Pagato',
      'refunded': 'Rimborsato',
      'cancelled': 'Annullato'
    };
    return labels[status] || status;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'cash': '💵',
      'card': '💳',
      'digital_wallet': '📱',
      'bank_transfer': '🏦'
    };
    return icons[method] || '💰';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Caricamento dati cassa...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0, fontSize: '2em' }}>💰 Cassa - Billing & Payments</h1>
        <div style={{ fontSize: '1em', opacity: 0.8, marginTop: '5px' }}>
          Gestione conti e pagamenti
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid #eee'
      }}>
        {[
          { id: 'orders', label: '📋 Ordini Pronti', count: readyOrders.length },
          { id: 'bills', label: '🧾 Conti', count: bills.filter(b => b.status === 'pending' || b.status === 'partially_paid').length },
          { id: 'payment', label: '💳 Pagamento', disabled: !selectedBill }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === tab.id ? '#0984e3' : tab.disabled ? '#f0f0f0' : 'white',
              color: activeTab === tab.id ? 'white' : tab.disabled ? '#999' : '#333',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #0984e3' : '3px solid transparent',
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: tab.disabled ? 0.5 : 1
            }}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div>
          <h2>Ordini Pronti per il Pagamento</h2>
          
          {readyOrders.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              color: '#666'
            }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>✅</div>
              <h3>Nessun ordine pronto per il pagamento</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {readyOrders.map((order) => (
                <div 
                  key={order.id}
                  style={{ 
                    border: '2px solid #4caf50',
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{order.order_number}</h3>
                      <div style={{ color: '#666', marginTop: '5px' }}>
                        Tavolo {order.table_number} • {order.customer_name || 'Cliente'}
                      </div>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: '#666',
                        marginTop: '5px'
                      }}>
                        Ordinato: {new Date(order.created_at).toLocaleString('it-IT')}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1.5em', 
                        fontWeight: 'bold',
                        color: '#0984e3'
                      }}>
                        €{order.final_amount}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        (IVA incl. €{order.tax_amount})
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}>
                    <strong>Articoli ({order.items.length}):</strong>
                    <div style={{ marginTop: '10px', display: 'grid', gap: '5px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          fontSize: '0.9em'
                        }}>
                          <span>{item.quantity}x {item.menu_item_name}</span>
                          <span style={{ fontWeight: 'bold' }}>€{item.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCreateBill(order)}
                    style={{
                      width: '100%',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '1em',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🧾 Crea Conto
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2>Conti</h2>
            <button 
              onClick={loadData}
              style={{
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Aggiorna
            </button>
          </div>

          {bills.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              color: '#666'
            }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>🧾</div>
              <h3>Nessun conto trovato</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {bills.map((bill) => (
                <div 
                  key={bill.id}
                  style={{ 
                    border: `2px solid ${getStatusColor(bill.status)}`,
                    borderRadius: '8px',
                    padding: '20px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{bill.bill_number}</h3>
                      <div style={{ color: '#666', marginTop: '5px' }}>
                        Ordine: {bill.order_number} • Tavolo {bill.table_number}
                      </div>
                      {bill.customer_name && (
                        <div style={{ color: '#666', fontSize: '0.9em' }}>
                          Cliente: {bill.customer_name}
                        </div>
                      )}
                      <div style={{ 
                        marginTop: '8px',
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(bill.status),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        fontWeight: 'bold'
                      }}>
                        {getStatusLabel(bill.status)}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        Totale Conto
                      </div>
                      <div style={{ 
                        fontSize: '1.5em', 
                        fontWeight: 'bold',
                        color: '#0984e3'
                      }}>
                        €{bill.total_amount}
                      </div>
                      {bill.status !== 'paid' && bill.remaining_amount > 0 && (
                        <div style={{ 
                          fontSize: '0.9em', 
                          color: '#f44336',
                          marginTop: '5px'
                        }}>
                          Rimangono: €{bill.remaining_amount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '6px',
                    marginBottom: '15px',
                    fontSize: '0.9em'
                  }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotale:</span>
                        <span>€{bill.subtotal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>IVA:</span>
                        <span>€{bill.tax_amount}</span>
                      </div>
                      {bill.tip_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4caf50' }}>
                          <span>Mancia:</span>
                          <span>€{bill.tip_amount}</span>
                        </div>
                      )}
                      {bill.discount_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f44336' }}>
                          <span>Sconto:</span>
                          <span>-€{bill.discount_amount}</span>
                        </div>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid #ddd',
                        fontWeight: 'bold'
                      }}>
                        <span>Totale:</span>
                        <span>€{bill.total_amount}</span>
                      </div>
                      {bill.paid_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4caf50' }}>
                          <span>Già Pagato:</span>
                          <span>€{bill.paid_amount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payments List */}
                  {bill.payments && bill.payments.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Pagamenti ({bill.payments.length}):</strong>
                      <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                        {bill.payments.map((payment) => (
                          <div key={payment.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '4px',
                            fontSize: '0.9em'
                          }}>
                            <span>
                              {getPaymentMethodIcon(payment.payment_method)} {payment.payment_number}
                            </span>
                            <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
                              €{payment.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                    <button
                      onClick={() => handleSelectBillForPayment(bill)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0984e3',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '1em',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      💳 Procedi al Pagamento
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payment' && selectedBill && (
        <div>
          <h2>Elaborazione Pagamento</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Payment Form */}
            <div style={{ 
              border: '2px solid #0984e3',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white'
            }}>
              <h3>Dettagli Pagamento</h3>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Importo da Pagare:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedBill.remaining_amount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1.2em',
                      borderRadius: '6px',
                      border: '2px solid #ddd'
                    }}
                  />
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                    Massimo: €{selectedBill.remaining_amount}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Metodo di Pagamento:
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1em',
                      borderRadius: '6px',
                      border: '2px solid #ddd'
                    }}
                  >
                    <option value="cash">💵 Contanti</option>
                    <option value="card">💳 Carta</option>
                    <option value="digital_wallet">📱 Portafoglio Digitale</option>
                    <option value="bank_transfer">🏦 Bonifico Bancario</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Numero di Riferimento (opzionale):
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="es. numero transazione, assegno..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '2px solid #ddd'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Note (opzionale):
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Note aggiuntive..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '2px solid #ddd',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleProcessPayment}
                    style={{
                      flex: 1,
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '6px',
                      fontSize: '1.1em',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Conferma Pagamento
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('bills');
                      setSelectedBill(null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '6px',
                      fontSize: '1.1em',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Annulla
                  </button>
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div style={{ 
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              height: 'fit-content'
            }}>
              <h3>Riepilogo Conto</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                  {selectedBill.bill_number}
                </div>
                <div style={{ color: '#666', fontSize: '0.9em' }}>
                  Tavolo {selectedBill.table_number} • {selectedBill.order_number}
                </div>
              </div>

              <div style={{ 
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '6px',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'grid', gap: '10px', fontSize: '0.9em' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Totale Conto:</span>
                    <span style={{ fontWeight: 'bold' }}>€{selectedBill.total_amount}</span>
                  </div>
                  {selectedBill.paid_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4caf50' }}>
                      <span>Già Pagato:</span>
                      <span style={{ fontWeight: 'bold' }}>€{selectedBill.paid_amount}</span>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '2px solid #ddd',
                    fontSize: '1.1em'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Rimangono:</span>
                    <span style={{ fontWeight: 'bold', color: '#f44336' }}>
                      €{selectedBill.remaining_amount}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBill.payments && selectedBill.payments.length > 0 && (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    Pagamenti Precedenti:
                  </div>
                  {selectedBill.payments.map((payment) => (
                    <div key={payment.id} style={{ 
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      fontSize: '0.85em'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{getPaymentMethodIcon(payment.payment_method)} {payment.payment_method}</span>
                        <span style={{ fontWeight: 'bold', color: '#4caf50' }}>€{payment.amount}</span>
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9em' }}>
                        {new Date(payment.created_at).toLocaleString('it-IT')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>Statistiche Cassa</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '16px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#ff9800' }}>
              {readyOrders.length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Ordini Pronti</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#f44336' }}>
              {bills.filter(b => b.status === 'pending').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Da Pagare</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#2196f3' }}>
              {bills.filter(b => b.status === 'partially_paid').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Parzialmente Pagati</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#4caf50' }}>
              {bills.filter(b => b.status === 'paid').length}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Pagati</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#0984e3' }}>
              €{bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.total_amount, 0).toFixed(2)}
            </div>
            <div style={{ color: '#666', fontSize: '0.9em' }}>Totale Incassato</div>
          </div>
        </div>
      </div>
    </div>
  );
}
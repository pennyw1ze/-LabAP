import React, { useEffect, useState } from "react";
import { getPayments, makePayment } from "../api";

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getPayments()
      .then(data => {
        if (Array.isArray(data)) {
          setPayments(data);
        } else if (data.payments && Array.isArray(data.payments)) {
          setPayments(data.payments);
        } else {
          console.error("Payments API returned unexpected data:", data);
          setPayments([]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handlePayment = async (payment) => {
    try {
      const result = await makePayment(payment);
      setPayments(prev => [...prev, result]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="payments">
      <div>
        <h2>💳 Pagamenti</h2>
        <span className="text-muted">Gestisci le transazioni con un pannello in stile Liquid Glass.</span>
      </div>

      <div className="payments__actions">
        <button
          type="button"
          className="button-glass button-glass--primary"
          onClick={() => handlePayment({ orderId: "esempio-id", amount: 20 })}
        >
          ➕ Simula Pagamento
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state">Nessun pagamento registrato.</div>
      ) : (
        <ul className="payments__list">
          {payments.map((payment) => (
            <li key={payment.id || payment._id || payment.orderId} className="payments__item">
              <span>
                Ordine {payment.orderId || payment.order_id} · €{payment.amount} · {payment.status}
              </span>
              {payment.method && <span className="text-muted">Metodo: {payment.method}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

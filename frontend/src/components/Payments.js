import React, { useEffect, useState } from "react";
import { getPayments } from "../api";

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

  return (
    <section className="payments">
      <div>
        <h2>💳 Pagamenti</h2>
          <span className="text-muted">Genera i pagamenti per i tuoi ordini</span>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state">Nessun ordine da saldare</div>
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

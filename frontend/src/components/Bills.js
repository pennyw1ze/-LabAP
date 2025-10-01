import React, { useEffect, useState } from "react";
import { getBills } from "../api";

export default function Bills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    getBills()
      .then(data => {
        if (Array.isArray(data)) {
          setBills(data);
        } else if (data.bills && Array.isArray(data.bills)) {
          setBills(data.bills);
        } else {
          console.error("Bills API returned unexpected data:", data);
          setBills([]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="payments">
      <div>
        <h2>🧾 Conti</h2>
        <span className="text-muted">Riepilogo dei conti generati per gli ordini.</span>
      </div>

      {bills.length === 0 ? (
        <div className="empty-state">Nessun conto disponibile.</div>
      ) : (
        <ul className="payments__list">
          {bills.map((bill) => (
            <li key={bill.id || bill._id} className="payments__item">
              <span>
                Conto {bill.id || bill._id} · Ordine {bill.orderId || bill.order_id} · €{bill.total}
              </span>
              {bill.status && <span className="text-muted">Stato: {bill.status}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

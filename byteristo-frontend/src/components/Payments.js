import React, { useEffect, useState } from "react";
import { getPayments, makePayment } from "../api";

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getPayments()
      .then(data => {
        // Controllo della struttura dei dati
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
    <div>
      <h2>Payments</h2>
      <button onClick={() => handlePayment({ orderId: "example-id", amount: 20 })}>
        Make Payment
      </button>
      <ul className="order-list">
        {payments.map(p => (
          <li key={p.id}>
            Order {p.orderId} - ${p.amount} - {p.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

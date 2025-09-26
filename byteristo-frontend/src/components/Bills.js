import React, { useEffect, useState } from "react";
import { getBills } from "../api";

export default function Bills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    getBills()
      .then(data => {
        // Controllo della struttura dei dati
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
    <div>
      <h2>Bills</h2>
      <ul>
        {bills.map(b => (
          <li key={b.id}>
            Bill {b.id} - Order {b.orderId} - ${b.total}
          </li>
        ))}
      </ul>
    </div>
  );
}

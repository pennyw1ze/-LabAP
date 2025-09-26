import React, { useState } from 'react';
import Menu from './Menu'; // Importa il componente Menu

export default function Order() {
  const [order, setOrder] = useState([]);
  const [total, setTotal] = useState(0);

  const addToOrder = (item) => {
    setOrder(prevOrder => [...prevOrder, item]);
    setTotal(prevTotal => prevTotal + item.price);
  };

  const handleSubmitOrder = () => {
    console.log('Ordine:', order);
    alert(`Ordine inviato! Totale: €${total.toFixed(2)}`);
    // Puoi inviare l'ordine al backend qui
  };

  return (
    <div>
      <h2>Componi il tuo Ordine</h2>
      <Menu addToOrder={addToOrder} />
      <h3>Carrello</h3>
      <ul>
        {order.map((item, index) => (
          <li key={index}>
            {item.name} - €{item.price}
          </li>
        ))}
      </ul>
      <h3>Totale: €{total.toFixed(2)}</h3>
      <button onClick={handleSubmitOrder}>Invia Ordine</button>
    </div>
  );
}

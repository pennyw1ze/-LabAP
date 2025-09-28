import React, { useState } from 'react';
import MenuOrder from './Menu'; // Importa il componente Menu

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
      <h2>Nuovo Ordine</h2>
      <MenuOrder addToOrder={addToOrder} />
      <h3>Carrello</h3>
      <ul className="order-list">
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

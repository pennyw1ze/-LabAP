import React from 'react';
import { menuItems } from './Menu'; // Importa il menuItems esportato

export default function MenuDisplay() {
  return (
    <div>
      <h2>Menu</h2>
      <ul className="order-list"> 
        {menuItems.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>, {item.description} - €{item.price}
            <p></p>
          </li>
        ))}
      </ul>
    </div>
  );
}

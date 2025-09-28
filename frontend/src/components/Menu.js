import React, { useState } from 'react';

export const menuItems = [
  { id: '1', name: 'Pizza Margherita', description: 'Pizza con pomodoro, mozzarella e basilico', price: 8.5 },
  { id: '2', name: 'Lasagna', description: 'Lasagna con carne, pomodoro e formaggio', price: 12 },
  { id: '3', name: 'Bucatini Carbonara', description: 'Spaghetti con uova, guanciale e pecorino', price: 10 },
  { id: '4', name: 'Risotto alla Boscaiola', description: 'Risotto con funghi porcini e salsicce', price: 11 },
  { id: '5', name: 'Tiramisu', description: 'Dolce al caffè e mascarpone', price: 5.5 }
];

export default function MenuOrder({ addToOrder }) {
  const [selectedItem, setSelectedItem] = useState('');

  const handleSelectItem = (e) => {
    setSelectedItem(e.target.value);
  };

  const handleAddToOrder = () => {
    if (selectedItem) {
      const item = menuItems.find((item) => item.id === selectedItem);
      if (item) {
        addToOrder(item); // Aggiunge l'articolo all'ordine
      }
    }
  };

  return (
    <div>
      <select onChange={handleSelectItem} value={selectedItem}>
        <option value="">Seleziona un piatto</option>
        {menuItems.map(item => (
          <option key={item.id} value={item.id}>
            {item.name} - €{item.price}
          </option>
        ))}
      </select>
      <button onClick={handleAddToOrder}>Aggiungi al carrello</button>
    </div>
  );
}

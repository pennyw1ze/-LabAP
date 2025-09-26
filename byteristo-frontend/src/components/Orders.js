import React, { useEffect, useState } from 'react';
import { fetchMenuItems } from '../api';  // Assicurati che il percorso sia corretto

export default function Order() {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  useEffect(() => {
    const loadMenuItems = async () => {
      const items = await fetchMenuItems();
      setMenuItems(items);  // Imposta gli articoli del menu
    };

    loadMenuItems();  // Carica gli articoli al caricamento del componente
  }, []);

  const handleSubmit = () => {
    // Logica per inviare l'ordine
    console.log('Ordine inviato:', selectedItem);
  };

  return (
    <div>
      <h2>Nuovo Ordine</h2>
      <select
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)} // Gestisci la selezione
      >
        <option value="">Seleziona un articolo</option>
        {menuItems.length > 0 ? (
          menuItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))
        ) : (
          <option>Loading menu...</option> // Messaggio di caricamento
        )}
      </select>
      <button onClick={handleSubmit}>Invia Ordine</button>
    </div>
  );
}

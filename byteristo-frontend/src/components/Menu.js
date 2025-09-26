import React, { useEffect, useState } from 'react';
import { fetchMenuItems } from '../api'; // Assicurati che il percorso sia corretto

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const loadMenuItems = async () => {
      const items = await fetchMenuItems();  // Recupera gli articoli dal menu
      setMenuItems(items);  // Aggiorna lo stato con gli articoli del menu
    };

    loadMenuItems();  // Carica gli articoli del menu al caricamento del componente
  }, []);

  return (
    <div>
      <h2>Menu</h2>
      <select>
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
    </div>
  );
}

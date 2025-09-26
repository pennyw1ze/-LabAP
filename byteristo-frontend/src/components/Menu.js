import React, { useEffect, useState } from "react";
import { getMenu } from "../api";

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    getMenu()
      .then(data => {
        // Se data è un oggetto con "menu" dentro
        if (data.menu) {
          setMenuItems(data.menu);
        } else if (Array.isArray(data)) {
          setMenuItems(data);
        } else {
          console.error("Menu API returned unexpected data:", data);
          setMenuItems([]);
        }
      })
      .catch(err => console.error(err));
  }, []);
}  

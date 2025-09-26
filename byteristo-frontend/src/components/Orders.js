import React, { useEffect, useState } from "react";
import { getOrders, createOrder } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getOrders()
      .then(data => {
        // Controllo della struttura dei dati
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          console.error("Orders API returned unexpected data:", data);
          setOrders([]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleCreateOrder = async () => {
    const newOrder = {
      tableNumber: 1,
      waiterId: "waiter-001",
      waiterName: "John Doe",
      customerName: "Alice Smith",
      items: [
        { menuItemId: "example-id", quantity: 1, specialInstructions: "" }
      ]
    };

    try {
      const createdOrder = await createOrder(newOrder);
      setOrders(prev => [...prev, createdOrder]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Orders</h2>
      <button onClick={handleCreateOrder}>Create Order</button>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            Table {order.tableNumber} - Customer: {order.customerName} - Status: {order.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

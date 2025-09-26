import React, { useEffect, useState } from "react";
import { getAnalytics } from "../api";

export default function Analytics() {
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    getAnalytics().then(data => setAnalytics(data)).catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Analytics</h2>
      <pre>{JSON.stringify(analytics, null, 2)}</pre>
    </div>
  );
}

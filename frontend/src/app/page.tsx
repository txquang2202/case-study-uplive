"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [data, setData] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const response = await axios.get(`${apiUrl}/api`);
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Case Study - Fullstack App</h1>

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
        }}
      >
        <h2>API Connection Status</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {data && (
          <div>
            <p style={{ color: "green" }}>✓ Connected to Backend</p>
            <p>Response: {data}</p>
          </div>
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Ready for Implementation</h2>
        <p>
          This boilerplate is ready to be adapted based on the technical test
          requirements.
        </p>
        <ul>
          <li>✓ Next.js App Router configured</li>
          <li>✓ NestJS backend ready</li>
          <li>✓ PostgreSQL database setup</li>
          <li>✓ Docker environment configured</li>
          <li>✓ TypeScript support enabled</li>
        </ul>
      </section>
    </main>
  );
}

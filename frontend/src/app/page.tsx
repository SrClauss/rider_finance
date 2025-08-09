
"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Busca token no cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    const token = getCookie("auth_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    // Opcional: validar token no backend
    // fetch('/api/validate_token', { headers: { Authorization: `Bearer ${token}` } })
    //   .then(res => res.json())
    //   .then(data => { if (!data.valid) window.location.href = "/login"; });
  }, []);
  return (
    <div>Bem-vindo ao Rider Finance</div>
  );
}

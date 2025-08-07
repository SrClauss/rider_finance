"use client";
import React from "react";
import dynamic from "next/dynamic";

export function isAuthenticated() {
  if (typeof document === "undefined") return false;
  // Busca o cookie 'authToken'
  return document.cookie.split('; ').some((cookie) => cookie.startsWith('authToken='));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setAuth(isAuthenticated());
    setMounted(true);
    // Observa mudanças nos cookies (não há evento nativo, então pode-se usar polling simples)
    const interval = setInterval(() => {
      setAuth(isAuthenticated());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Evita renderização até o componente estar montado no client
  if (!mounted) return null;

  if (!auth) {
    // Importação dinâmica do LoginPage
    const LoginPage = dynamic(() => import("../../app/login/page"), { ssr: false });
    return <LoginPage />;
  }
  return <>{children}</>;
}

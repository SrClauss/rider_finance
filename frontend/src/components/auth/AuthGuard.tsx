"use client";
import React from "react";
import dynamic from "next/dynamic";

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("authToken");
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<boolean>(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setAuth(isAuthenticated());
    setMounted(true);
    const onStorage = () => setAuth(isAuthenticated());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

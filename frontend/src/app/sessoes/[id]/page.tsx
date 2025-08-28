"use client";
import React, { useEffect, useState } from "react";
import LoggedLayout from "@/layouts/LoggedLayout";
import axios from "axios";
import TransactionListCompact from "@/components/transactions/TransactionListCompact";
import SessionResumo from "@/components/session/SessionResumo";
import type { SessaoComTransacoes } from "@/interfaces/SessaoComTransacoes";
import { useParams } from 'next/navigation';
export default function SessaoDetailPage() {
  const params = useParams() as { id?: string } | undefined;
  const id: string | undefined = params?.id;
  const [data, setData] = useState<SessaoComTransacoes | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get(`/api/sessao/com-transacoes/${id}`, { withCredentials: true })
      .then((res) => setData(res.data as SessaoComTransacoes))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <LoggedLayout>
      {loading ? (
        <div style={{ padding: 32, textAlign: "center" }}>Carregando...</div>
      ) : data && data.transacoes ? (
        <>
          <TransactionListCompact transactions={data.transacoes} />
          <SessionResumo transacoes={data.transacoes} />
        </>
      ) : (
        <div style={{ padding: 32, textAlign: "center" }}>Nenhuma transação encontrada.</div>
      )}
    </LoggedLayout>
  );
}

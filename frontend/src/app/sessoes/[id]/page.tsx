// import React from "react";
"use client"
import React, { useEffect, useState } from "react";
import LoggedLayout from "@/layouts/LoggedLayout";
import TransactionListCompact from "@/components/transactions/TransactionListCompact";
import SessionResumo from "@/components/session/SessionResumo";
import type { SessaoComTransacoes } from "@/interfaces/SessaoComTransacoes";
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function SessaoDetailPage(props: any) {
  const id = props?.params?.id;
  const [data, setData] = React.useState<SessaoComTransacoes | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    import("axios").then(({ default: axios }) => {
      axios
        .get(`/api/sessao/com-transacoes/${id}`, { withCredentials: true })
        .then((res) => {
          setData(res.data as SessaoComTransacoes);
        })
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    });
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

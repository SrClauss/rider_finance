import React from "react";
import SessionDetailClient from "@/components/session/SessionDetailClient";
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function SessaoDetailPage(props: any) {
  const id = props?.params?.id;
  return <SessionDetailClient sessaoId={id} />;
}

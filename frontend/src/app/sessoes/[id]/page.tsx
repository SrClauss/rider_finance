import React from "react";
import SessionDetailClient from "@/components/session/SessionDetailClient";
import LoggedLayout from "@/layouts/LoggedLayout";
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function SessaoDetailPage(props: any) {
  const id = props?.params?.id;
  return (
    <LoggedLayout>
      <SessionDetailClient sessaoId={id} />
    </LoggedLayout>
  );
}

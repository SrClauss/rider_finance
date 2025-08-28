"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";

export default function ViewDashboardButton() {
  const router = useRouter();
  return (
    <Button variant="contained" color="primary" onClick={() => router.push('/dashboard')}>
      Ver meu dashboard
    </Button>
  );
}

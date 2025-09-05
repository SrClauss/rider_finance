"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import UserList from "@/components/admin/UserList";

export default function AdminUsersPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Gerenciar Usuários</Typography>
      <UserList />
    </Box>
  );
}

"use client";
import React from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  severity?: AlertColor;
  message: React.ReactNode;
  autoHideDuration?: number;
};

export default function Toast({ open, onClose, severity = "info", message, autoHideDuration = 4000 }: Props) {
  return (
    <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

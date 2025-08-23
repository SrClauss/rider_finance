"use client";

import React, { useMemo, useEffect,  useState, useCallback, createContext, useContext } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme, lightTheme } from "./uber-theme";

const ThemeModeContext = createContext({
  mode: "dark",
  setMode: (_: "light" | "dark") => {},
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeProvider({ children, forcedMode }: { children: React.ReactNode, forcedMode?: "light" | "dark" }) {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    if (forcedMode) return forcedMode;
    if (typeof window !== "undefined") {
      return (localStorage.getItem("themeMode") as "light" | "dark") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (forcedMode && forcedMode !== mode) setMode(forcedMode);
  }, [forcedMode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("themeMode", next);
      }
      return next;
    });
  }, []);

  const muiTheme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}

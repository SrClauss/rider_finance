import { ShowChart, SpeedRounded, WatchLater } from "@mui/icons-material";
import { ReactNode } from "react";
import CustomIcon from "./CustomIcon";

export function getIconForTitle(title: string): ReactNode {
  switch (title) {
    case "Corridas":
      return <CustomIcon src="/99logo.png" alt="99 Taxi Logo" size={35} />;
    case "Ganhos":
      return <ShowChart sx={{ color: "success.main", fontWeight: "bold" }} />;
    case "Despesas":
      return <ShowChart sx={{ color: "error.main", fontWeight: "bold" }} />;
    case "Horas":
      return <WatchLater sx={{ color: "warning.main", fontWeight: "bold" }} />;
    default:
      return <SpeedRounded sx={{ color: "info.main", fontWeight: "bold" }} />;
  }
}

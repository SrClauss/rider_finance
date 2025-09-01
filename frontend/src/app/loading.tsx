import React from "react";
import RouteTransition from "@/components/transitions/RouteTransition";

export default function LoadingPage() {
  return <RouteTransition message="Carregando conteúdo..." />;
}

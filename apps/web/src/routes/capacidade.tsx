import { createFileRoute } from "@tanstack/react-router";
import CapacityDashboard from "../components/CapacityDashboard";

export const Route = createFileRoute("/capacidade")({
  component: CapacityDashboard,
});

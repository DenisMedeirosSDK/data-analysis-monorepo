import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, FileSpreadsheet, Layers3, Truck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const navigation = [
  { to: "/", label: "Visão geral", icon: FileSpreadsheet },
  { to: "/uz", label: "UZs não recebidas", icon: BarChart3 },
  { to: "/capacidade", label: "Capacidade por rota", icon: Truck },
] as const;

export default function AppSidebar() {
  const { setOpen } = useSidebar();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          to="/"
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-teal-400 text-slate-950">
            <Layers3 size={19} />
          </span>
          <span>
            <span className="block text-sm font-semibold">Data Lab</span>
            <span className="block text-xs text-slate-500">
              Inteligência operacional
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="mt-7">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[.16em] text-slate-600">
          Análises
        </p>
        <SidebarMenu>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton active={pathname === item.to} asChild>
                  <Link to={item.to} onClick={() => setOpen(false)}>
                    <Icon size={17} />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-xs text-slate-600">TP 654 · Operações</p>
      </SidebarFooter>
    </Sidebar>
  );
}

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import AppSidebar from "../components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import "../styles/global.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "Data Lab para análise operacional." },
    ],
    links: [],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <Document>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="fixed left-3 top-3 z-30 lg:hidden">
            <SidebarTrigger className="border border-slate-800 bg-[#0c1220]" />
          </div>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </Document>
  );
}

function Document({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#090d16]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

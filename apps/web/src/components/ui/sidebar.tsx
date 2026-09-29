import { Slot } from "@radix-ui/react-slot";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar deve ser usado dentro de SidebarProvider.");
  return context;
}

function SidebarProvider({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen w-full bg-[#090d16]">{children}</div>
    </SidebarContext.Provider>
  );
}

function Sidebar({ children, className }: React.HTMLAttributes<HTMLElement>) {
  const { open, setOpen } = useSidebar();
  return (
    <>
      {open ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-950/80 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-slate-800 bg-[#0c1220] text-slate-100 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open && "translate-x-0",
          className,
        )}
      >
        <button
          aria-label="Fechar menu"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-md text-slate-400 hover:bg-slate-800 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        >
          <X size={18} />
        </button>
        {children}
      </aside>
    </>
  );
}

function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 px-3", className)} {...props} />;
}

function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

function SidebarInset({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <main className={cn("min-w-0 flex-1", className)} {...props} />;
}

function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      aria-label={open ? "Fechar menu" : "Abrir menu"}
      className={cn(
        "grid size-9 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden",
        className,
      )}
      onClick={() => setOpen(!open)}
      type="button"
      {...props}
    >
      {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
    </button>
  );
}

function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("space-y-1", className)} {...props} />;
}

function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={className} {...props} />;
}

function SidebarMenuButton({
  active,
  asChild = false,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 outline-none transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-teal-400",
        active && "bg-teal-400/10 text-teal-300",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};

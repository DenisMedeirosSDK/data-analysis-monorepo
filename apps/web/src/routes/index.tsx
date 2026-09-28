import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSpreadsheet, LayoutDashboard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#090d16] p-6 text-slate-100">
      <section className="w-full max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-teal-400">
          Data Lab
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Análises operacionais, sem ruído.
        </h1>
        <p className="mt-4 max-w-xl text-slate-400">
          Acesse o dashboard para analisar UZs não recebidas por loja, rota e
          remessa.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-teal-400/30 bg-gradient-to-br from-slate-900 to-teal-950/30">
            <CardContent className="p-6">
              <LayoutDashboard className="text-teal-400" size={24} />
              <h2 className="mt-5 font-semibold">Dashboard de UZs</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Importe uma planilha e acompanhe ocorrências, distribuição e
                detalhes.
              </p>
              <Button asChild className="mt-6">
                <Link to="/uz">
                  Abrir dashboard
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <FileSpreadsheet className="text-slate-400" size={24} />
              <h2 className="mt-5 font-semibold">Formato aceito</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                CSV ou XLSX com as colunas UZ, Loja, Remessa e Rota.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

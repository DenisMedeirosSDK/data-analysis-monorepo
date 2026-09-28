import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers3,
  LoaderCircle,
  Map as MapIcon,
  PackageSearch,
  RefreshCw,
  Search,
  Store,
  Truck,
  Upload,
} from "lucide-react";
import { type SyntheticEvent, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type RecordUZ = { UZ: string; Loja: string; Remessa: string; Rota: string };
type Group = { label: string; value: number };
const pageSize = 15;
const number = new Intl.NumberFormat("pt-BR");

function group(records: RecordUZ[], field: keyof RecordUZ): Group[] {
  const map = new Map<string, number>();
  for (const record of records)
    map.set(
      record[field] || "Não informado",
      (map.get(record[field] || "Não informado") || 0) + 1,
    );
  return [...map]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
function Metric({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Store;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-px ${accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.14em] text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </div>
          <span className="rounded-lg bg-slate-800 p-2.5 text-slate-300">
            <Icon size={18} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
function ChartCard({
  title,
  detail,
  data,
  color,
}: {
  title: string;
  detail: string;
  data: Group[];
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-100">{title}</CardTitle>
        <p className="text-xs text-slate-500">{detail}</p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.slice(0, 8)}
            layout="vertical"
            margin={{ left: -20, right: 8, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="#1e293b" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              width={68}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "#1e293b" }}
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value) => [number.format(Number(value)), "UZs"]}
            />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
export default function UzDashboard() {
  const [records, setRecords] = useState<RecordUZ[]>([]);
  const [filters, setFilters] = useState({
    Loja: "",
    Rota: "",
    Remessa: "",
    UZ: "",
  });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(
    "Importe uma planilha para iniciar a análise.",
  );
  const [loading, setLoading] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const filtered = useMemo(
    () =>
      records.filter(
        (record) =>
          (!filters.Loja || record.Loja === filters.Loja) &&
          (!filters.Rota || record.Rota === filters.Rota) &&
          (!filters.Remessa || record.Remessa === filters.Remessa) &&
          (!filters.UZ ||
            record.UZ.toLowerCase().includes(filters.UZ.toLowerCase())),
      ),
    [records, filters],
  );
  const data = useMemo(
    () => ({
      stores: group(filtered, "Loja"),
      routes: group(filtered, "Rota"),
      shipments: group(filtered, "Remessa"),
    }),
    [filtered],
  );
  const values = (field: keyof RecordUZ) =>
    [...new Set(records.map((record) => record[field]).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "pt-BR", { numeric: true }),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  function update(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.current) return;
    const file = new FormData(form.current).get("file");
    if (!(file instanceof File) || !file.size) return;
    setLoading(true);
    setStatus("Processando planilha…");
    try {
      const response = await fetch("/api/uz/dashboard", {
        method: "POST",
        body: new FormData(form.current),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.detail || "Não foi possível processar a planilha.",
        );
      setRecords(payload.records);
      setFilters({ Loja: "", Rota: "", Remessa: "", UZ: "" });
      setPage(1);
      setStatus(
        number.format(payload.records.length) +
          " registros carregados de " +
          payload.filename +
          ".",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Falha ao processar a planilha.",
      );
    } finally {
      setLoading(false);
    }
  }
  const active = records.length > 0;
  const topFive = data.stores
    .slice(0, 5)
    .reduce((total, item) => total + item.value, 0);
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      <aside className="fixed inset-y-0 hidden w-64 border-r border-slate-800 bg-[#0c1220] p-5 lg:block">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-400 text-slate-950">
            <Layers3 size={19} />
          </span>
          <div>
            <p className="text-sm font-semibold">Data Lab</p>
            <p className="text-xs text-slate-500">Operations intelligence</p>
          </div>
        </div>
        <nav className="mt-12 space-y-1 text-sm">
          <a
            className="flex items-center gap-3 rounded-md bg-slate-800 px-3 py-2.5 text-white"
            href="/uz"
          >
            <BarChart3 size={17} />
            Visão operacional
          </a>
          <a
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-400 hover:bg-slate-800"
            href="/capacidade"
          >
            <Truck size={17} />
            Capacidade por rota
          </a>{" "}
          <a
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-400 hover:bg-slate-800"
            href="/"
          >
            <FileSpreadsheet size={17} />
            Analisar planilha
          </a>
        </nav>
        <div className="absolute bottom-6 text-xs text-slate-600">
          TP 654 · Operações
        </div>
      </aside>
      <main className="lg:ml-64">
        <header className="border-b border-slate-800 bg-[#0c1220]/80 px-5 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[.18em] text-teal-400">
                Monitoramento de exceções
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                UZs não recebidas
              </h1>
            </div>
            <form
              ref={form}
              onSubmit={submit}
              className="flex items-center gap-2"
            >
              <label className="hidden sm:block">
                <span className="sr-only">Planilha de UZs</span>
                <input
                  name="file"
                  type="file"
                  accept=".csv,.xlsx"
                  className="max-w-48 text-xs text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-slate-800 file:px-2.5 file:py-2 file:text-slate-200"
                />
              </label>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                <span className="hidden sm:inline">Importar dados</span>
              </Button>
            </form>
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">
          <section className="mb-7 flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-[#0d1822] p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Painel de ocorrências em trânsito
              </p>
              <p role="status" className="mt-1 text-sm text-slate-500">
                {status}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw size={14} />
              <span>Atualização sob demanda</span>
            </div>
          </section>
          {!active ? (
            <Card>
              <CardContent className="grid min-h-96 place-items-center p-8 text-center">
                <div>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-800 text-teal-400">
                    <FileSpreadsheet size={25} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">
                    Dados prontos para análise
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Importe uma planilha CSV ou XLSX com as colunas UZ, Loja,
                    Remessa e Rota para visualizar o painel operacional.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Metric
                  label="UZs não recebidas"
                  value={number.format(new Set(filtered.map((r) => r.UZ)).size)}
                  detail="Ocorrências únicas"
                  icon={PackageSearch}
                  accent="bg-rose-400"
                />
                <Metric
                  label="Lojas impactadas"
                  value={number.format(
                    new Set(filtered.map((r) => r.Loja)).size,
                  )}
                  detail="Com ao menos uma UZ"
                  icon={Store}
                  accent="bg-cyan-400"
                />
                <Metric
                  label="Rotas ativas"
                  value={number.format(
                    new Set(filtered.map((r) => r.Rota)).size,
                  )}
                  detail="Rotas em exceção"
                  icon={MapIcon}
                  accent="bg-violet-400"
                />
                <Metric
                  label="Remessas"
                  value={number.format(
                    new Set(filtered.map((r) => r.Remessa)).size,
                  )}
                  detail="Remessas monitoradas"
                  icon={Truck}
                  accent="bg-amber-400"
                />
                <Metric
                  label="Concentração top 5"
                  value={
                    (filtered.length
                      ? (topFive / filtered.length) * 100
                      : 0
                    ).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
                    "%"
                  }
                  detail="Das UZs em cinco lojas"
                  icon={BarChart3}
                  accent="bg-teal-400"
                />
              </section>
              <Card className="mb-6">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base">Refinar análise</CardTitle>
                    <p className="mt-1 text-xs text-slate-500">
                      Os indicadores e gráficos respondem aos filtros.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilters({ Loja: "", Rota: "", Remessa: "", UZ: "" });
                      setPage(1);
                    }}
                  >
                    <RefreshCw size={14} />
                    Limpar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <FilterSelect
                      label="Loja"
                      icon={Store}
                      value={filters.Loja}
                      values={values("Loja")}
                      onChange={(value) => update("Loja", value)}
                    />
                    <FilterSelect
                      label="Rota"
                      icon={MapIcon}
                      value={filters.Rota}
                      values={values("Rota")}
                      onChange={(value) => update("Rota", value)}
                    />
                    <FilterSelect
                      label="Remessa"
                      icon={Truck}
                      value={filters.Remessa}
                      values={values("Remessa")}
                      onChange={(value) => update("Remessa", value)}
                    />
                    <label className="relative block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-400">
                        Buscar UZ
                      </span>
                      <Search
                        className="absolute bottom-2.5 left-3 text-slate-500"
                        size={16}
                      />
                      <input
                        value={filters.UZ}
                        onChange={(event) => update("UZ", event.target.value)}
                        placeholder="Código da UZ"
                        className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-3 text-sm outline-none ring-teal-400 focus:ring-2"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
              <section className="grid gap-5 xl:grid-cols-3">
                <ChartCard
                  title="Lojas com maior impacto"
                  detail="Top 8 por quantidade de UZs"
                  data={data.stores}
                  color="#2dd4bf"
                />
                <ChartCard
                  title="Distribuição por rota"
                  detail="Top 8 rotas em ocorrência"
                  data={data.routes}
                  color="#60a5fa"
                />
                <ChartCard
                  title="Distribuição por remessa"
                  detail="Top 8 remessas em ocorrência"
                  data={data.shipments}
                  color="#a78bfa"
                />
              </section>
              <Card className="mt-6">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      Detalhamento de ocorrências
                    </CardTitle>
                    <p className="mt-1 text-xs text-slate-500">
                      {number.format(filtered.length)} registros após os filtros
                    </p>
                  </div>
                  <ArrowDownToLine size={18} className="text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[.12em] text-slate-500">
                          <th className="pb-3 font-medium">UZ</th>
                          <th className="pb-3 font-medium">Loja</th>
                          <th className="pb-3 font-medium">Remessa</th>
                          <th className="pb-3 font-medium">Rota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.UZ}
                            className="border-b border-slate-800/70 text-slate-300 hover:bg-slate-800/40"
                          >
                            <td className="py-3 font-mono text-xs text-slate-200">
                              {row.UZ}
                            </td>
                            <td className="py-3">{row.Loja}</td>
                            <td className="py-3 font-mono text-xs">
                              {row.Remessa}
                            </td>
                            <td className="py-3">
                              <span className="rounded bg-slate-800 px-2 py-1 text-xs">
                                {row.Rota}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Página {page} de {pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft size={15} />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                      >
                        Próxima
                        <ChevronRight size={15} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  icon: LucideIcon;
  value: string;
  values: string[];
  onChange: (value: string) => void;
};

export function FilterSelect({
  label,
  icon: Icon,
  value,
  values,
  onChange,
}: FilterSelectProps) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-slate-400">{label}</span>

      <Select
        value={value || "all"}
        onValueChange={(value) => onChange(value === "all" ? "" : value)}
      >
        <SelectTrigger className="h-10 w-full border-slate-700 bg-slate-950 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="size-4 shrink-0 text-slate-500" />

            <SelectValue placeholder="Todas" />
          </div>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>

          {values.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

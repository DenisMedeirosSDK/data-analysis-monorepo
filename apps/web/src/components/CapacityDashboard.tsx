import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  PackageCheck,
  Truck,
} from "lucide-react";
import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type Load = {
  date: string;
  hour: string;
  route: string;
  stock_route: string;
  truck: string;
  stores: string;
  required: number;
  available_before: number;
  served: number;
  shortage: number;
  remaining: number;
  status: string;
};
type Summary = {
  route: string;
  required: number;
  initial_available: number;
  served: number;
  total_shortage: number;
  final_balance: number;
  status: string;
};
type Report = {
  date: string;
  available_dates: string[];
  loads: Load[];
  summary: Summary[];
  totals: { loads: number; required: number; served: number; shortage: number };
};
const number = new Intl.NumberFormat("pt-BR");
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function apiDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Truck;
  tone: "teal" | "rose" | "blue" | "amber";
}) {
  const colors = {
    teal: "text-teal-300 bg-teal-400/10",
    rose: "text-rose-300 bg-rose-400/10",
    blue: "text-blue-300 bg-blue-400/10",
    amber: "text-amber-300 bg-amber-400/10",
  };
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[.13em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${colors[tone]}`}>
          <Icon size={18} />
        </span>
      </CardContent>
    </Card>
  );
}

export default function CapacityDashboard() {
  const form = useRef<HTMLFormElement>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState(
    "Envie os três arquivos e selecione a data de carregamento.",
  );
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const summary = useMemo(
    () =>
      report?.summary.map((item) => ({
        ...item,
        shortLabel:
          item.route.length > 13 ? `${item.route.slice(0, 13)}…` : item.route,
      })) ?? [],
    [report],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.current) return;
    setLoading(true);
    setStatus("Validando a disponibilidade por rota…");
    try {
      const response = await fetch("/api/capacity/validate", {
        method: "POST",
        body: new FormData(form.current),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          typeof payload.detail === "string"
            ? payload.detail
            : payload.detail?.message ||
                "Não foi possível validar os arquivos.",
        );
      setReport(payload);
      setStatus(
        "Validação concluída para " +
          dateFormat.format(new Date(`${payload.date}T00:00:00Z`)) +
          ".",
      );
    } catch (error) {
      setReport(null);
      setStatus(
        error instanceof Error
          ? error.message
          : "Falha ao validar a capacidade.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d16] p-5 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-375">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-slate-800 pb-7 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-teal-400">
              Planejamento diário
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Capacidade por rota
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Validação sequencial do saldo disponível para cada carregamento.
            </p>
          </div>
        </header>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Arquivos e data de análise
            </CardTitle>
            <p className="text-sm text-slate-500">
              A programação é filtrada somente pela data escolhida; cargas da
              mesma rota de estoque consomem o saldo em ordem de horário.
            </p>
          </CardHeader>
          <CardContent>
            <form
              ref={form}
              onSubmit={submit}
              className="grid gap-4 lg:grid-cols-5 justify-center items-end"
            >
              <UploadField
                name="availability"
                label="Disponibilidade"
                help="Rota e Peças"
              />
              <UploadField
                name="schedule"
                label="Programação"
                help="Carregamento e capacidade"
              />
              <UploadField
                name="stores"
                label="Lojas e rotas"
                help="Loja e Max Peças"
              />
              <div>
                <span className="mb-2 block text-xs font-medium text-slate-400">
                  Data de carregamento
                </span>
                <input
                  name="date"
                  type="hidden"
                  value={apiDate(selectedDate)}
                />
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-slate-700 bg-slate-950 font-normal hover:bg-slate-900"
                    >
                      <CalendarDays className="text-slate-500" size={16} />
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (!date) return;
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button className="" type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <PackageCheck size={16} />
                )}
                {loading ? "Validando" : "Validar"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p role="status" className="mb-6 text-sm text-slate-400">
          {status}
        </p>
        {!report ? (
          <Card>
            <CardContent className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-800 text-teal-400">
                  <FileSpreadsheet size={22} />
                </span>
                <h2 className="mt-4 font-semibold">
                  Pronto para validar a operação
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Use as amostras em{" "}
                  <code className="text-slate-300">data/capacidade</code> para
                  testar a análise.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Carregamentos"
                value={number.format(report.totals.loads)}
                icon={Truck}
                tone="blue"
              />
              <Metric
                label="Peças necessárias"
                value={number.format(report.totals.required)}
                icon={PackageCheck}
                tone="teal"
              />
              <Metric
                label="Peças atendidas"
                value={number.format(report.totals.served)}
                icon={CheckCircle2}
                tone="teal"
              />
              <Metric
                label="Peças faltantes"
                value={number.format(report.totals.shortage)}
                icon={AlertTriangle}
                tone={report.totals.shortage ? "rose" : "amber"}
              />
            </section>
            <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Necessidade e faltante por rota
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Comparação consolidada após todos os carregamentos do dia.
                  </p>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary}
                      margin={{ left: -16, right: 6, top: 6, bottom: 6 }}
                    >
                      <CartesianGrid vertical={false} stroke="#1e293b" />
                      <XAxis
                        dataKey="shortLabel"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: 8,
                        }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Bar
                        dataKey="initial_available"
                        name="Saldo disponível"
                        fill="#2dd4bf"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="required"
                        name="Necessário"
                        fill="#38bdf8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="total_shortage"
                        name="Faltante"
                        fill="#fb7185"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo por rota</CardTitle>
                  <p className="text-xs text-slate-500">
                    {dateFormat.format(new Date(`${report.date}T00:00:00Z`))}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.summary.map((item) => (
                    <div
                      key={item.route}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-200">
                          {item.route}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Disponível: {number.format(item.initial_available)} ·
                          Necessário: {number.format(item.required)}
                        </p>
                      </div>
                      <span
                        className={
                          item.total_shortage
                            ? "rounded-md bg-rose-400/10 px-2 py-1 text-xs font-medium text-rose-300"
                            : "rounded-md bg-teal-400/10 px-2 py-1 text-xs font-medium text-teal-300"
                        }
                      >
                        {item.total_shortage
                          ? `${number.format(item.total_shortage)} faltantes`
                          : "Suficiente"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Sequência de carregamentos
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Cada linha usa o saldo deixado pelo carregamento anterior da
                  mesma rota de estoque.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[.1em] text-slate-500">
                        <th className="pb-3">Hora</th>
                        <th className="pb-3">Rota / Carreta</th>
                        <th className="pb-3">Necessário</th>
                        <th className="pb-3">Saldo antes</th>
                        <th className="pb-3">Atendido</th>
                        <th className="pb-3">Faltante</th>
                        <th className="pb-3">Saldo após</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.loads.map((load) => (
                        <tr
                          key={`${load.route}-${load.hour}-${load.truck}`}
                          className="border-b border-slate-800/70"
                        >
                          <td className="py-3 text-slate-400">
                            {load.hour || "—"}
                          </td>
                          <td className="py-3">
                            <p className="font-medium">{load.route}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {load.truck || "Sem carreta identificada"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Estoque associado: {load.stock_route}
                            </p>
                          </td>
                          <td className="py-3">
                            {number.format(load.required)}
                          </td>
                          <td className="py-3">
                            {number.format(load.available_before)}
                          </td>
                          <td className="py-3 text-teal-300">
                            {number.format(load.served)}
                          </td>
                          <td className="py-3 text-rose-300">
                            {number.format(load.shortage)}
                          </td>
                          <td className="py-3">
                            {number.format(load.remaining)}
                          </td>
                          <td className="py-3">
                            <span
                              className={
                                load.shortage
                                  ? "text-xs font-medium text-rose-300"
                                  : "text-xs font-medium text-teal-300"
                              }
                            >
                              {load.shortage ? "Falta peças" : "Suficiente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
function UploadField({
  name,
  label,
  help,
}: {
  name: string;
  label: string;
  help: string;
}) {
  return (
    <label>
      <span className="block text-xs font-medium text-slate-400">{label}</span>
      <span className="mt-1 block text-xs text-slate-600">{help}</span>
      <input
        required
        name={name}
        type="file"
        accept=".xlsx"
        className="mt-2 block w-full text-xs text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-slate-800 file:px-2.5 file:py-2 file:text-slate-200"
      />
    </label>
  );
}

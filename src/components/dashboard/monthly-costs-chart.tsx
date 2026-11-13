"use client";

/**
 * Gráfica de costos por mes (últimos 12 meses): compra, mantenimiento y
 * reparación apilados. Cliente porque Recharts mide el DOM.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MonthlyPoint {
  month: string;
  compra: number;
  mantenimiento: number;
  reparacion: number;
}

/** Convierte "2026-03" en "mar 26". */
function shortMonth(m: string): string {
  const [year, month] = m.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
  }).format(date);
}

export default function MonthlyCostsChart({ data }: { data: MonthlyPoint[] }) {
  const points = data.map((d) => ({
    ...d,
    label: shortMonth(d.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Costos por mes</CardTitle>
        <CardDescription>Últimos 12 meses, en pesos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 4, right: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${Math.round(v / 1_000)}k`
                      : String(v)
                }
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  }).format(Number(value))
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="compra"
                name="Compra"
                stackId="a"
                fill="var(--chart-1, #6366f1)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="mantenimiento"
                name="Mantenimiento"
                stackId="a"
                fill="var(--chart-2, #22c55e)"
              />
              <Bar
                dataKey="reparacion"
                name="Reparación"
                stackId="a"
                fill="var(--chart-3, #f59e0b)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

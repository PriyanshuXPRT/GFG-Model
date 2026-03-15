"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { DashboardData } from "@/lib/api";

const COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#3b82f6", "#84cc16", "#f97316",
];

const TOOLTIP_STYLE = {
  backgroundColor: "#13152e",
  border: "1px solid rgba(99,102,241,0.35)",
  borderRadius: "10px",
  color: "#f0f0ff",
  fontSize: "13px",
};

function formatValue(v: any): string {
  const val = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(val)) return '0';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface Props {
  data: DashboardData;
  onDrillDown?: (label: string) => void;
}

export default function DashboardRenderer({ data, onDrillDown }: Props) {
  const chartData = data.chart_data.map((d) => ({
    name: d.label,
    value: d.value,
  }));

  const metricLabel = data.metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (data.chart_type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            angle={-35}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickFormatter={formatValue}
            width={60}
          />
          <Tooltip
            formatter={(v: number) => [formatValue(v), metricLabel]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: "#6366f1", r: 3 }}
            activeDot={{ r: 6, fill: "#a5b4fc" }}
          />
          <Brush
            dataKey="name"
            height={30}
            stroke="#4f46e5"
            fill="#13152e"
            travellerWidth={10}
            startIndex={0}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (data.chart_type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={55}
            paddingAngle={3}
            onClick={(data) => data?.name && onDrillDown?.(data.name)}
            style={{ cursor: onDrillDown ? "pointer" : "default" }}
            label={({ name, percent }: any) =>
              `${(name || '').length > 12 ? (name || '').slice(0, 12) + "…" : (name || '')} ${((percent || 0) * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: "rgba(99,102,241,0.4)" }}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [formatValue(v), metricLabel]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            wrapperStyle={{ color: "#9ca3af", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (data.chart_type === "histogram") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            angle={-35}
            textAnchor="end"
          />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={formatValue} width={60} />
          <Tooltip
            formatter={(v: number) => [formatValue(v), metricLabel]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar
            dataKey="value"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onDrillDown?.(data.name)}
            style={{ cursor: onDrillDown ? "pointer" : "default" }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar chart
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          angle={-35}
          textAnchor="end"
        />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={formatValue} width={60} />
        <Tooltip
          formatter={(v: any) => [formatValue(v), metricLabel]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          onClick={(data) => onDrillDown?.(data.name)}
          style={{ cursor: onDrillDown ? "pointer" : "default" }}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// lib/api.ts — typed fetch wrapper for the FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardData {
  title: string;
  summary: string;
  chart_type: "bar" | "line" | "pie" | "histogram" | "scatter";
  chart_data: ChartDataPoint[];
  metric: string;
  group_by: string | null;
  aggregation: string;
  filters_applied: Record<string, string>;
  total_rows_queried: number;
  data_points: number;
}

export interface QueryResponse {
  success: boolean;
  data?: DashboardData;
  query_struct?: Record<string, unknown>;
  error?: string;
}

export interface SchemaInfo {
  columns: string[];
  dtypes: Record<string, string>;
  descriptions: Record<string, string>;
  numeric_columns: string[];
  categorical_columns: string[];
  sample_values: Record<string, (string | number)[]>;
  row_count: number;
}

export async function postQuery(
  query: string,
  conversationHistory: { query: string; title?: string }[] = []
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      conversation_history: conversationHistory,
    }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchSchema(): Promise<SchemaInfo> {
  const res = await fetch(`${API_BASE}/api/schema`);
  if (!res.ok) throw new Error("Failed to fetch schema");
  const json = await res.json();
  return json.schema;
}

export async function uploadCSV(file: File): Promise<{
  success: boolean;
  rows: number;
  columns: string[];
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

/**
 * MetroFlow API client — typed fetchers for the FastAPI backend (Doc 11).
 * Falls back gracefully (returns null) when the API is unreachable so the
 * dashboard still renders with built-in mock data.
 */
// Client calls go through the same-origin Next proxy, which attaches the
// Supabase token server-side and forwards to FastAPI (see app/api/proxy).
const BASE = "/api/proxy";

async function req<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type CrowdPrediction = {
  station_id: string;
  hour: number;
  crowd_level: "Low" | "Medium" | "High" | "Critical";
  congestion_probability: number;
  confidence: number;
  model: { name: string; version: string; algorithm: string };
  estimated: boolean;
};

export type DemandPrediction = {
  station_id: string;
  hour: number;
  passenger_count: number;
  confidence: number;
};

export async function predictCrowd(body: {
  station_id: string;
  hour: number;
  context?: Record<string, unknown>;
}): Promise<CrowdPrediction | null> {
  const r = await req<{ data: CrowdPrediction }>("/ai/predict/crowd", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return r?.data ?? null;
}

export async function predictDemand(body: {
  station_id: string;
  hour: number;
  context?: Record<string, unknown>;
}): Promise<DemandPrediction | null> {
  const r = await req<{ data: DemandPrediction }>("/ai/predict/demand", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return r?.data ?? null;
}

export type ApiAlert = {
  id: string;
  type: "overcrowding" | "delay" | "emergency";
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "open" | "acknowledged" | "resolved";
  message: string;
  line: string;
  station: string;
  ago: string;
};

export async function getAlerts(): Promise<{ alerts: ApiAlert[]; source: string } | null> {
  const r = await req<{ data: ApiAlert[]; meta: { source: string } }>("/alerts");
  return r ? { alerts: r.data, source: r.meta?.source ?? "api" } : null;
}

export async function ackAlert(id: string): Promise<boolean> {
  const r = await req<{ data: unknown }>(`/alerts/${id}/ack`, { method: "POST" });
  return r !== null;
}

export async function createAlert(body: {
  message: string;
  type?: string;
  severity?: string;
  line_name?: string;
}): Promise<boolean> {
  const r = await req<{ data: unknown }>("/alerts", {
    method: "POST",
    body: JSON.stringify({ type: "emergency", severity: "emergency", ...body }),
  });
  return r !== null;
}

export async function decideReco(body: {
  line: string;
  slot: string;
  current: number;
  recommended: number;
  score: number;
  decision: "applied" | "dismissed";
}): Promise<boolean> {
  const r = await req<{ data: unknown }>("/schedules/recommendations/decide", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return r !== null;
}

export type ApiStation = {
  station_id: string;
  station_name: string;
  metro_name: string;
  city: string;
  line_name: string;
  station_category: string;
  interchange_station: string;
  daily_average_footfall: number;
};

export async function getStations(): Promise<ApiStation[] | null> {
  const r = await req<{ data: ApiStation[] }>("/stations?page_size=1000");
  return r?.data ?? null;
}

export type ApiUser = {
  id: string; full_name: string; role: string; network: string;
  is_active: boolean; email: string; created_at: string | null;
};

export async function getUsers(): Promise<ApiUser[] | null> {
  const r = await req<{ data: ApiUser[] }>("/users");
  return r?.data ?? null;
}

export async function inviteUser(body: {
  email: string; password: string; full_name?: string; role?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/proxy/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const d = await res.json().catch(() => ({}));
    return { ok: false, error: d?.detail || d?.error?.message || "Invite failed" };
  } catch {
    return { ok: false, error: "Could not reach the server" };
  }
}

export type TimePoint = { label: string; passengers: number };

export async function getTimeseries(range: string): Promise<TimePoint[] | null> {
  const r = await req<{ data: TimePoint[] }>(`/analytics/timeseries?range=${range}`);
  return r?.data ?? null;
}

export async function chat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string | null> {
  const r = await req<{ data: { answer: string } }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
  return r?.data?.answer ?? null;
}

export async function apiHealth(): Promise<boolean> {
  const r = await req<{ status: string }>("/health");
  return r?.status === "ok";
}

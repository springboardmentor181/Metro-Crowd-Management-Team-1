/**
 * MetroFlow API client — typed fetchers for the FastAPI backend (Doc 11).
 * Falls back gracefully (returns null) when the API is unreachable so the
 * dashboard still renders with built-in mock data.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

/** Attach the Supabase access token so the backend can verify the caller. */
async function authHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(await authHeader()),
        ...(init?.headers || {}),
      },
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

export async function apiHealth(): Promise<boolean> {
  const r = await req<{ status: string }>("/health");
  return r?.status === "ok";
}

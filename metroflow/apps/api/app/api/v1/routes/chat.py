"""MetroBot — LLM chatbot (Groq) grounded in the live MetroFlow data.

Builds a compact, data-rich system prompt from the analytics report, the trained
model metrics and current alerts, then answers via Groq's OpenAI-compatible API.
"""
from __future__ import annotations

import json

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import ARTIFACTS_DIR, settings
from app.core.security import Principal, get_principal
from app.data import db, store

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


def _fmt(d: dict, n: int = 8) -> str:
    return ", ".join(f"{k}: {v:,}" if isinstance(v, int) else f"{k}: {v}" for k, v in list(d.items())[:n])


def build_context() -> str:
    a = store.analytics_report()["analytics"]
    parts: list[str] = []
    parts.append(
        "You are MetroBot, the AI assistant inside MetroFlow — an AI-powered metro "
        "crowd management and smart scheduling platform. It monitors passenger flow, "
        "predicts crowd density, analyzes station congestion and optimizes train "
        "scheduling using ONLY ticketing and operational data (no cameras/CCTV)."
    )
    parts.append(
        "DATASET: 571,540 records across 8 relational tables; 725 stations; 17 metro "
        "networks; 23 cities; 11 states; 90-day window (Oct-Dec 2024)."
    )
    top = "; ".join(f"{s['station']} ({s['metro']}, {s['footfall']:,})" for s in a["top_footfall_stations"][:8])
    parts.append(f"TOP FOOTFALL STATIONS: {top}.")
    parts.append(f"AVG DAILY FLOW BY CITY (top): {_fmt(a['city_avg_daily_flow'])}.")
    lines = "; ".join(f"{l['line']} ({l['pct_high_or_critical']}%)" for l in a["most_congested_lines"][:6])
    parts.append(f"MOST CONGESTED CORRIDORS (% station-hours High/Critical): {lines}.")
    parts.append(f"CROWD-LEVEL DISTRIBUTION (station-hours): {_fmt(a['crowd_density_distribution'])}.")
    peaks = ", ".join(f"{p['hour']}:00 ({p['passengers']:,})" for p in a["peak_hours"][:4])
    parts.append(f"PEAK HOURS (passengers): {peaks}. Morning peak ~09:00, evening peak ~19:00.")
    parts.append(
        f"WEEKDAY avg flow {a['avg_flow_weekday']:,} vs WEEKEND {a['avg_flow_weekend']:,}; "
        f"avg festival demand impact +{a['avg_festival_impact_pct']}%."
    )
    parts.append(f"STATIONS BY NETWORK: {_fmt(a['stations_by_metro'], 17)}.")
    parts.append(f"STATIONS BY CATEGORY: {_fmt(a['stations_by_category'])}.")
    parts.append(f"TICKET TYPES: {_fmt(a['ticket_type_distribution'])}. PAYMENT: {_fmt(a['payment_method_distribution'])}.")
    parts.append(
        f"OPERATIONS: {_fmt(a['service_status_distribution'])}; avg delay {a['avg_delay_minutes']} min; "
        f"avg fare ₹{a['avg_fare']}; avg trip {a['avg_travel_duration_min']} min; interchanges {a['interchange_count']}."
    )

    # model metrics
    mpath = ARTIFACTS_DIR / "model_metrics.json"
    if mpath.exists():
        try:
            m = json.loads(mpath.read_text())
            c = m["crowd_classifier"]["xgboost"]
            dr = m["demand_regressor"]
            parts.append(
                f"AI MODELS: crowd classifier = XGBoost (accuracy {c['accuracy']}, macro-F1 {c['macro_f1']}, "
                f"Critical recall {c['recall_per_class']['Critical']}); demand regressor R2 {dr['r2']}, MAPE {dr['mape_pct']}%. "
                f"Top drivers: {', '.join(f['feature'] for f in m['feature_importance'][:4])}."
            )
        except Exception:
            pass

    # current alerts
    if settings.db_enabled:
        try:
            rows = db.query("select count(*) filter (where status='open') as open, count(*) as total from alerts")
            parts.append(f"CURRENT ALERTS: {rows[0]['open']} open of {rows[0]['total']}.")
        except Exception:
            pass

    parts.append(
        "INSTRUCTIONS: Answer as MetroBot — concise, friendly and specific, using the data above. "
        "Prefer concrete numbers. If a question is outside metro operations or the data, say so briefly. "
        "Keep answers under ~120 words. Plain text, no markdown headers."
    )
    return "\n".join(parts)


@router.post("/ai/chat")
async def chat(req: ChatRequest, _: Principal = Depends(get_principal)) -> dict:
    if not settings.groq_api_key:
        raise HTTPException(503, "Chatbot is not configured (no GROQ_API_KEY)")

    messages = [{"role": "system", "content": build_context()}]
    for m in req.history[-6:]:
        if m.role in ("user", "assistant") and m.content:
            messages.append({"role": m.role, "content": m.content[:2000]})
    messages.append({"role": "user", "content": req.message[:2000]})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": settings.groq_model,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 600,
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Chat service unreachable: {exc}") from exc

    if r.status_code >= 400:
        raise HTTPException(502, f"Groq error: {r.text[:200]}")
    data = r.json()
    answer = data["choices"][0]["message"]["content"].strip()
    return {"data": {"answer": answer, "model": settings.groq_model}}

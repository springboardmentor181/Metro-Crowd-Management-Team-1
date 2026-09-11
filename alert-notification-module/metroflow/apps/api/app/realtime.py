"""Real-time layer (Planning Doc 09 §7) — a lightweight replay engine over a
WebSocket. Streams live network state + alerts on a simulated clock so the
dashboard updates in real time without a live data source."""
from __future__ import annotations

import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.core.security import _decode
from app.data import store

LINES = ["Blue Line", "Yellow Line", "Red Line", "Magenta Line", "Airport Express"]
TICK_SECONDS = 4


def register_realtime(app: FastAPI) -> None:
    @app.websocket("/ws/live")
    async def ws_live(ws: WebSocket) -> None:
        # verify the Supabase token (passed as a query param) when auth is on
        token = ws.query_params.get("token")
        if settings.auth_enabled:
            try:
                if not token:
                    raise ValueError("missing token")
                _decode(token)
            except Exception:
                await ws.close(code=1008)
                return

        await ws.accept()
        a = store.analytics_report()["analytics"]
        pbh: dict[str, int] = a["passengers_by_hour"]
        hours = sorted(int(h) for h in pbh)
        max_p = max(pbh.values()) or 1
        top = [s["station"] for s in a["top_footfall_stations"]]

        i = 0
        try:
            await ws.send_json({"type": "hello", "data": {"speed": settings.replay_default_speed}})
            while True:
                h = hours[i % len(hours)]
                p = pbh[str(h)]
                load = round(p / max_p * 100, 1)
                level = (
                    "Critical" if load > 85 else "High" if load > 68
                    else "Medium" if load > 45 else "Low"
                )
                await ws.send_json({
                    "type": "tick",
                    "data": {
                        "clock": f"{h:02d}:00",
                        "network_load": load,
                        "passengers_k": round(p / 1000),
                        "level": level,
                    },
                })
                # emit an overcrowding alert when the network is under load
                if load > 68 and i % 3 == 0:
                    st = top[i % len(top)]
                    sev = "Critical" if load > 85 else "High"
                    await ws.send_json({
                        "type": "alert",
                        "data": {
                            "station": st,
                            "line": LINES[i % len(LINES)],
                            "severity": sev,
                            "message": f"{sev} crowding at {st} — network load {int(load)}%",
                            "clock": f"{h:02d}:00",
                        },
                    })
                i += 1
                await asyncio.sleep(TICK_SECONDS)
        except WebSocketDisconnect:
            return
        except Exception:
            return

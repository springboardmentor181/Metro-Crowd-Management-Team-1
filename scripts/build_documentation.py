# -*- coding: utf-8 -*-
"""Build documentation.pdf for the AI MetroFlow dataset using reportlab."""
import json, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, ListFlowable, ListItem)
from reportlab.lib.enums import TA_LEFT

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "MetroFlow_Dataset")
summary = json.load(open(os.path.join(BASE, "dataset_summary.json"), encoding="utf-8"))
report = json.load(open(os.path.join(BASE, "analytics_report.json"), encoding="utf-8"))
A = report["analytics"]
C = summary["counts"]

NAVY = colors.HexColor("#0f3d5c")
TEAL = colors.HexColor("#0e8a8a")
LIGHT = colors.HexColor("#eef4f7")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle("H1c", parent=styles["Heading1"], textColor=NAVY, spaceBefore=14, spaceAfter=6))
styles.add(ParagraphStyle("H2c", parent=styles["Heading2"], textColor=TEAL, spaceBefore=10, spaceAfter=4, fontSize=13))
styles.add(ParagraphStyle("Body", parent=styles["BodyText"], fontSize=9.5, leading=13, alignment=TA_LEFT))
styles.add(ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8, leading=10, textColor=colors.grey))
styles.add(ParagraphStyle("TitleBig", parent=styles["Title"], textColor=NAVY, fontSize=26))
styles.add(ParagraphStyle("Sub", parent=styles["Normal"], fontSize=12, textColor=TEAL, alignment=1))

story = []
def P(t, s="Body"): story.append(Paragraph(t, styles[s]))
def SP(h=6): story.append(Spacer(1, h))
def bullets(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, styles["Body"]), leftIndent=8) for i in items],
        bulletType="bullet", start="square", leftIndent=12))

def kv_table(data, col_widths=None, header=True):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    ts = [("FONTSIZE", (0,0), (-1,-1), 8.5),
          ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#c9d6dd")),
          ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
          ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
          ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3),
          ("LEFTPADDING",(0,0),(-1,-1),5)]
    if header:
        ts += [("BACKGROUND",(0,0),(-1,0),NAVY),("TEXTCOLOR",(0,0),(-1,0),colors.white),
               ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold")]
    t.setStyle(TableStyle(ts))
    return t

# ---------------- Cover ----------------
SP(80)
P("AI MetroFlow", "TitleBig")
P("AI Platform for Metro Crowd Management &amp; Scheduling", "Sub")
SP(10)
P("Large-Scale Synthetic Transportation Dataset for Indian Metro Systems", "Sub")
SP(40)
cover = [["Total records", f"{C['TOTAL']:,}"],
         ["Data window", summary["generated_at_window"] + f"  ({summary['num_days']} days)"],
         ["Metro networks", str(summary["metros"])],
         ["Cities covered", str(summary["cities"])],
         ["Unique stations", f"{C['metro_stations']:,}"],
         ["Datasets (CSV files)", "8"],
         ["Quality checks passed", f"{sum(1 for c in report['checks'] if c['pass'])}/{len(report['checks'])}"]]
story.append(kv_table([["Attribute","Value"]]+cover, col_widths=[70*mm, 90*mm]))
SP(30)
P("Document: dataset description, sources, generation methodology, feature "
  "dictionary, ML use cases, quality report, analytics, limitations and roadmap.", "Small")
story.append(PageBreak())

# ---------------- 1 Overview ----------------
P("1. Dataset Description &amp; Purpose", "H1c")
P("AI MetroFlow is a relational, ML-ready transportation dataset that emulates "
  "the operational data footprint of Indian metro networks <b>without any CCTV, "
  "computer-vision or facial-recognition data</b>. Every signal is derived from the "
  "kinds of records a metro authority already owns: ticketing, smart-card taps, "
  "automatic-fare-collection (AFC) entry/exit logs, station statistics, train "
  "operations telemetry, schedules and external context (weather / holidays / events).")
SP(4)
P("It is built to train and benchmark models for passenger crowd prediction, "
  "station congestion analysis, demand forecasting, train-frequency optimisation, "
  "peak-hour prediction and delay-impact analysis, and to power FastAPI backends "
  "and React analytics dashboards for smart-city demonstrations.")
SP(6)
P("Intended users", "H2c")
bullets(["Metro rail authorities &amp; operations control centres",
         "Smart-city transportation departments",
         "Urban mobility operators &amp; planning teams",
         "Public-transport analytics / data-science teams",
         "Hackathon and academic project teams"])

SP(6)
P("1.1 The eight datasets", "H2c")
files = [
 ["File", "Grain / one row is", "Records"],
 ["metro_stations.csv", "one unique station (interchanges merged)", f"{C['metro_stations']:,}"],
 ["passenger_flow.csv", "station x day x operating-hour footfall", f"{C['passenger_flow']:,}"],
 ["ticket_transactions.csv", "a single ticket / smart-card journey", f"{C['ticket_transactions']:,}"],
 ["train_operations.csv", "a train stop event (arrival/departure/delay)", f"{C['train_operations']:,}"],
 ["train_occupancy.csv", "train load sampled at a station", f"{C['train_occupancy']:,}"],
 ["external_factors.csv", "city x day weather / holiday / event context", f"{C['external_factors']:,}"],
 ["train_schedule.csv", "line x time-slot x day-type schedule &amp; recommendation", f"{C['train_schedule']:,}"],
 ["metro_ai_training_data.csv", "engineered feature/label row (station-hour)", f"{C['metro_ai_training_data']:,}"],
]
story.append(kv_table(files, col_widths=[52*mm, 82*mm, 26*mm]))
SP(4)
P(f"<b>Total: {C['TOTAL']:,} records.</b> The two prediction tables "
  "(passenger_flow and metro_ai_training_data) each exceed 200,000 rows, giving "
  "deep hourly time-series depth for LSTM / gradient-boosting models.", "Small")

story.append(PageBreak())

# ---------------- 2 Coverage ----------------
P("2. Network &amp; Geographic Coverage", "H1c")
P("Station names and line assignments are <b>real</b>, compiled from public metro "
  "network maps. The following networks are represented:")
sbm = A["stations_by_metro"]
rows = [["Metro network", "Stations"]] + [[k, str(v)] for k, v in sorted(sbm.items(), key=lambda x:-x[1])]
story.append(kv_table(rows, col_widths=[90*mm, 30*mm]))
SP(6)
P("2.1 Stations by state", "H2c")
sbs = A["stations_by_state"]
story.append(kv_table([["State", "Stations"]]+[[k,str(v)] for k,v in sorted(sbs.items(),key=lambda x:-x[1])],
                       col_widths=[90*mm, 30*mm]))
SP(6)
P("2.2 Stations by category", "H2c")
sbc = A["stations_by_category"]
story.append(kv_table([["Category", "Stations"]]+[[k,str(v)] for k,v in sorted(sbc.items(),key=lambda x:-x[1])],
                       col_widths=[90*mm, 30*mm]))
P(f"Interchange (multi-line) stations: <b>{A['interchange_count']}</b>.", "Small")

story.append(PageBreak())

# ---------------- 3 Sources ----------------
P("3. Data Sources", "H1c")
bullets([
 "<b>Station master (real):</b> station names, line memberships, terminals and "
 "opening years compiled from publicly available metro network maps of DMRC, "
 "MMRDA / Maha-Metro, BMRCL, HMRL, CMRL, Kolkata Metro, KMRL, GMRC, UPMRC, "
 "MEGA/JMRC, NMRC and others.",
 "<b>Geo-coordinates (approximated):</b> each station is placed by linear "
 "interpolation along its line's real terminal-to-terminal corridor with small "
 "Gaussian jitter, so stations are geographically ordered and city-plausible. "
 "Coordinates are approximate and NOT survey-grade.",
 "<b>Operational &amp; behavioural signals (synthetic):</b> footfall, entry/exit "
 "splits, occupancy, delays, fares and demand are generated from a rules-based "
 "stochastic model calibrated to well-known Indian metro behaviour (see Section 4).",
 "<b>External context (synthetic, calendar-aligned):</b> public holidays and "
 "festivals use the real 2024 calendar for the data window; weather and events "
 "are sampled from season/city-appropriate distributions.",
])

SP(6)
P("4. Data Generation Methodology", "H1c")
P("The generator is fully deterministic (fixed random seed = 42) and reproducible.", "Small")
P("4.1 Demand model", "H2c")
P("Each station has a <b>daily_average_footfall</b> derived from a city-tier "
  "multiplier x category weight x interchange bonus x network-age factor x noise. "
  "Hourly volume is obtained by multiplying daily footfall by a category-specific "
  "hourly shape profile, then applying multiplicative factors:")
bullets([
 "<b>Hour-of-day profile</b> per category (commercial/IT peak at 09:00 &amp; 18:00; "
 "residential peaks morning-out / evening-in; airport flat; educational mid-day).",
 "<b>Entry/exit split</b> flips with direction of commute (residential is "
 "entry-heavy in the morning, commercial is exit-heavy).",
 "<b>Weekend factor</b> suppresses IT / office / education stations far more than "
 "commercial or residential ones.",
 "<b>External factor</b> = 1 + impact_percentage/100 from external_factors "
 "(holidays reduce office travel, festivals lift commercial/temple stations).",
 "<b>Event venue boost</b> raises 1-3 nearby stations on event days, concentrated "
 "in the evening hours.",
 "<b>Weather</b> dampens ridership on rain / heavy-rain / fog days.",
])
P("4.2 Cross-dataset consistency", "H2c")
P("external_factors is generated first, per city-day; passenger_flow, and hence "
  "metro_ai_training_data, JOIN weather / holiday / festival / event from it. "
  "Ticket fares are computed from the real haversine distance between the chosen "
  "entry and exit stations using Delhi-Metro-style distance slabs, with a 10% "
  "smart-card / pass discount.")

story.append(PageBreak())

# ---------------- 5 feature dictionary ----------------
P("5. Feature Dictionary (key columns)", "H1c")

def field_table(title, rows):
    P(title, "H2c")
    story.append(kv_table([["Column", "Meaning"]] + rows, col_widths=[52*mm, 108*mm]))
    SP(4)

field_table("metro_stations.csv", [
 ["station_id", "unique PK, e.g. DEL001"],
 ["metro_name / state / city", "network and location"],
 ["station_name / station_code", "real name; short code"],
 ["line_name", "line(s); ' / '-joined for interchanges"],
 ["latitude / longitude", "approximate corridor-interpolated geo-point"],
 ["opening_year", "year the (earliest) line opened"],
 ["interchange_station", "Yes if station serves &gt;1 line"],
 ["platform_count", "number of platforms"],
 ["daily_average_footfall", "modelled daily throughput (entries+exits)"],
 ["station_category", "Commercial / Residential / Airport / Railway Connection / Educational Zone / IT Hub / Industrial Area"],
])
field_table("passenger_flow.csv", [
 ["record_id", "unique PK"],
 ["date / time", "day and hour (05:00-23:00)"],
 ["station_id", "FK to master"],
 ["entry_count / exit_count / total_passengers", "throughput; entry+exit=total"],
 ["peak_hour_flag", "1 if 08-10 or 18-20"],
 ["weekday / holiday_flag", "day name; 1 on public holiday"],
 ["weather_condition / event_near_station", "joined from external_factors"],
 ["crowd_density_level", "Low / Medium / High / Critical"],
])
story.append(PageBreak())
field_table("ticket_transactions.csv", [
 ["transaction_id", "unique PK"],
 ["ticket_type", "Smart Card / QR Ticket / Token / Monthly Pass"],
 ["passenger_category", "General / Student / Senior Citizen / Women / Differently-abled / Tourist"],
 ["entry_station / exit_station", "journey OD pair (same network)"],
 ["travel_duration", "minutes (distance/speed + access)"],
 ["fare_amount", "INR from distance slab"],
 ["payment_method", "UPI / NCMC / Cash / Metro App / Card"],
])
field_table("train_operations.csv / train_occupancy.csv", [
 ["train_id", "service identifier"],
 ["arrival/departure/scheduled/actual_time", "stop timing"],
 ["delay_minutes", "accumulated delay at stop"],
 ["train_frequency", "headway in minutes"],
 ["occupancy_percentage", "load vs capacity (may exceed 100 at crush)"],
 ["service_status", "Running / Delayed / Cancelled / Maintenance"],
 ["coach_capacity / current_passengers", "occupancy table only"],
])
field_table("metro_ai_training_data.csv (ML-ready)", [
 ["INPUTS", "station_id, hour, day_of_week, previous_hour_passengers, previous_day_average, weather, holiday, event, train_frequency, occupancy"],
 ["future_crowd_level", "TARGET (classification): next-hour density"],
 ["future_passenger_count", "TARGET (regression): next-hour volume"],
 ["recommended_train_frequency", "TARGET: suggested headway"],
 ["congestion_probability", "TARGET: P(High/Critical) next hour"],
])

story.append(PageBreak())

# ---------------- 6 ML use cases ----------------
P("6. Machine-Learning Use Cases", "H1c")
uc = [
 ["Use case", "Type", "Suggested models", "Table / target"],
 ["Next-hour crowd prediction", "Classification", "RandomForest, XGBoost, LSTM",
  "metro_ai_training_data -> future_crowd_level"],
 ["Passenger demand forecasting", "Regression / TS", "XGBoost, LSTM, Prophet/SARIMA",
  "future_passenger_count"],
 ["Train frequency optimisation", "Regression / policy", "GBM, rule + RL",
  "train_schedule -> recommended_frequency"],
 ["Congestion detection", "Prob. classification", "LogReg, XGBoost",
  "congestion_probability"],
 ["Peak-hour prediction", "Classification", "any", "peak_hour_flag"],
 ["Delay-impact analysis", "Regression", "GBM", "train_operations.delay_minutes"],
]
story.append(kv_table(uc, col_widths=[42*mm, 28*mm, 45*mm, 45*mm]))
SP(6)
P("Recommended split: train on the first ~70 days, validate/test on the final "
  "~20 days (temporal hold-out) to avoid look-ahead leakage. All lag features in "
  "metro_ai_training_data reference only past values.", "Small")

SP(8)
P("7. Data-Quality Report", "H1c")
qc = [["Check", "Result"]] + [[c["check"], ("PASS " + c["detail"]) if c["pass"] else ("FAIL " + c["detail"])]
                              for c in report["checks"]]
story.append(kv_table(qc, col_widths=[110*mm, 50*mm]))
P(f"<b>{'All quality checks passed.' if report['all_checks_passed'] else 'Some checks failed.'}</b> "
  "No duplicate primary keys, full referential integrity, arithmetic consistency "
  "(entry+exit=total), no missing key fields, and all values within realistic ranges.", "Small")

story.append(PageBreak())

# ---------------- 8 analytics ----------------
P("8. Analytics Highlights", "H1c")
P("8.1 Busiest stations (by modelled daily footfall)", "H2c")
top = [["Station", "City", "Metro", "Footfall/day"]] + \
      [[r["station"], r["city"], r["metro"], f"{r['footfall']:,}"] for r in A["top_footfall_stations"]]
story.append(kv_table(top, col_widths=[52*mm, 30*mm, 45*mm, 30*mm]))
SP(6)
P("8.2 City comparison (average daily throughput across monitored stations)", "H2c")
cc = [["City", "Avg daily flow"]] + [[k, f"{v:,}"] for k, v in list(A["city_avg_daily_flow"].items())[:12]]
story.append(kv_table(cc, col_widths=[60*mm, 40*mm]))
SP(6)
P("8.3 Peak hours &amp; behaviour", "H2c")
bullets([
 "Busiest hours network-wide: " + ", ".join(f"{p['hour']}:00" for p in A["peak_hours"]) +
 " - a clear bimodal morning (08-09) and evening (18-19) commute pattern.",
 f"Average station-hour flow is {A['avg_flow_weekday']:,} on weekdays vs "
 f"{A['avg_flow_weekend']:,} on weekends (office/IT stations drive the drop).",
 f"Crowd-density mix across all flow records: " +
 ", ".join(f"{k} {v:,}" for k, v in A['crowd_density_distribution'].items()) + ".",
 f"Average fare Rs {A['avg_fare']}, average journey {A['avg_travel_duration_min']} minutes.",
 f"Train service status: " + ", ".join(f"{k} {v:,}" for k,v in A['service_status_distribution'].items()) +
 f"; mean delay {A['avg_delay_minutes']} min.",
])

SP(8)
P("9. Data Limitations", "H1c")
bullets([
 "<b>Synthetic operational data.</b> Footfall, occupancy, delays and fares are "
 "modelled, not measured; absolute magnitudes are plausible but not official AFC counts.",
 "<b>Approximate coordinates.</b> Geo-points are interpolated along real corridors, "
 "not surveyed; do not use for precise routing or distance certification.",
 "<b>Monitored-station flow.</b> Hourly passenger_flow covers the busiest "
 f"{summary['monitored_stations']} stations (top {6} per city); the full master lists all "
 f"{C['metro_stations']} stations.",
 "<b>Fixed 90-day window</b> (Oct-Dec 2024). Long-term seasonality (monsoon vs "
 "summer, multi-year growth) is not represented.",
 "<b>Simplified fare model</b> uses Delhi-style distance slabs uniformly across "
 "networks; real fares differ per operator.",
 "<b>Independent transaction sampling</b>: ticket ODs are footfall-weighted but "
 "not reconciled row-for-row with the aggregate passenger_flow counts.",
])

SP(6)
P("10. Future Improvements", "H1c")
bullets([
 "Ingest real open-data AFC / GTFS feeds where published to calibrate magnitudes.",
 "Extend to a full calendar year to capture monsoon and summer seasonality.",
 "Reconcile ticket_transactions exactly against passenger_flow aggregates.",
 "Add graph/network features (line topology, betweenness) for GNN models.",
 "Add real per-operator fare tables and true station coordinates.",
 "Publish a FastAPI service + React dashboard consuming these CSVs directly.",
])
SP(10)
P("Generated by the AI MetroFlow synthetic data pipeline - deterministic (seed 42), "
  "reproducible via scripts/generate_metroflow.py.", "Small")

doc = SimpleDocTemplate(os.path.join(BASE, "documentation.pdf"), pagesize=A4,
                        leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm,
                        title="AI MetroFlow Dataset Documentation", author="AI MetroFlow")
doc.build(story)
print("Wrote documentation.pdf")

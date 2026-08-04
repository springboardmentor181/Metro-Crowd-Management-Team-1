# -*- coding: utf-8 -*-
"""Quality validation + analytics for the MetroFlow dataset (stdlib only)."""
import csv, os, json, statistics
from collections import defaultdict, Counter

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "MetroFlow_Dataset")

def load(name):
    with open(os.path.join(BASE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f))

print("Loading ...")
stations = load("metro_stations.csv")
flow = load("passenger_flow.csv")
tickets = load("ticket_transactions.csv")
ops = load("train_operations.csv")
occ = load("train_occupancy.csv")
ext = load("external_factors.csv")
sched = load("train_schedule.csv")
ai = load("metro_ai_training_data.csv")

sid_set = {s["station_id"] for s in stations}
report = {"checks": [], "analytics": {}}
def check(name, ok, detail=""):
    report["checks"].append({"check": name, "pass": bool(ok), "detail": detail})
    print(f"  [{'PASS' if ok else 'FAIL'}] {name} {detail}")

print("\n== QUALITY CHECKS ==")
# 1 unique PKs
check("metro_stations.station_id unique",
      len(sid_set) == len(stations), f"{len(stations)} rows")
check("passenger_flow.record_id unique",
      len({r['record_id'] for r in flow}) == len(flow), f"{len(flow)} rows")
check("ticket_transactions.transaction_id unique",
      len({r['transaction_id'] for r in tickets}) == len(tickets), f"{len(tickets)} rows")

# 2 referential integrity
bad_flow = sum(1 for r in flow if r["station_id"] not in sid_set)
check("passenger_flow.station_id -> master FK", bad_flow == 0, f"{bad_flow} orphans")
bad_tx = sum(1 for r in tickets if r["station_id"] not in sid_set)
check("ticket_transactions.station_id -> master FK", bad_tx == 0, f"{bad_tx} orphans")
bad_ops = sum(1 for r in ops if r["station_id"] not in sid_set)
check("train_operations.station_id -> master FK", bad_ops == 0, f"{bad_ops} orphans")
bad_occ = sum(1 for r in occ if r["station_id"] not in sid_set)
check("train_occupancy.station_id -> master FK", bad_occ == 0, f"{bad_occ} orphans")
bad_ai = sum(1 for r in ai if r["station_id"] not in sid_set)
check("metro_ai_training_data.station_id -> master FK", bad_ai == 0, f"{bad_ai} orphans")

# 3 arithmetic consistency entry+exit==total
bad_sum = sum(1 for r in flow if int(r["entry_count"]) + int(r["exit_count"]) != int(r["total_passengers"]))
check("passenger_flow entry+exit == total", bad_sum == 0, f"{bad_sum} mismatches")

# 4 no missing values in key columns
miss = 0
for r in flow:
    if any(r[c] == "" for c in ["date", "time", "station_id", "total_passengers", "crowd_density_level"]):
        miss += 1
check("passenger_flow no missing key fields", miss == 0, f"{miss} rows with gaps")

# 5 value ranges
lat_ok = all(6 <= float(s["latitude"]) <= 35 for s in stations)
lon_ok = all(68 <= float(s["longitude"]) <= 98 for s in stations)
check("station coordinates within India bbox", lat_ok and lon_ok)
occ_ok = all(0 <= float(r["occupancy_percentage"]) <= 150 for r in occ)
check("train_occupancy pct in [0,150]", occ_ok)
fare_ok = all(9 <= int(r["fare_amount"]) <= 60 for r in tickets)
check("fares within slab [9,60]", fare_ok)
dens_ok = all(r["crowd_density_level"] in {"Low","Medium","High","Critical"} for r in flow)
check("crowd_density_level in allowed set", dens_ok)

# 6 external_factors coverage cities x days
n_days = len({r["date"] for r in ext})
n_cities = len({r["city"] for r in ext})
check("external_factors = cities x days", len(ext) == n_days*n_cities,
      f"{n_cities} cities x {n_days} days")

print("\n== ANALYTICS ==")
A = report["analytics"]

# footfall extremes
st_sorted = sorted(stations, key=lambda s: -int(s["daily_average_footfall"]))
A["top_footfall_stations"] = [
    {"station": s["station_name"], "metro": s["metro_name"], "city": s["city"],
     "footfall": int(s["daily_average_footfall"])} for s in st_sorted[:10]]
A["bottom_footfall_stations"] = [
    {"station": s["station_name"], "metro": s["metro_name"], "city": s["city"],
     "footfall": int(s["daily_average_footfall"])} for s in st_sorted[-10:]]
print("  Top footfall:", A["top_footfall_stations"][0])

# peak hours (sum total by hour)
hour_tot = defaultdict(int)
for r in flow:
    hour_tot[int(r["time"][:2])] += int(r["total_passengers"])
A["passengers_by_hour"] = {str(h): hour_tot[h] for h in sorted(hour_tot)}
peak = sorted(hour_tot.items(), key=lambda x: -x[1])[:4]
A["peak_hours"] = [{"hour": h, "passengers": v} for h, v in peak]
print("  Peak hours:", A["peak_hours"])

# city comparison (avg daily throughput from flow)
sid_city = {s["station_id"]: s["city"] for s in stations}
sid_metro = {s["station_id"]: s["metro_name"] for s in stations}
city_flow = defaultdict(int)
city_days = defaultdict(set)
for r in flow:
    c = sid_city[r["station_id"]]
    city_flow[c] += int(r["total_passengers"])
    city_days[c].add(r["date"])
A["city_avg_daily_flow"] = {
    c: round(city_flow[c] / max(1, len(city_days[c]))) for c in
    sorted(city_flow, key=lambda x: -city_flow[x])}
print("  City avg daily flow (top 5):",
      dict(list(A["city_avg_daily_flow"].items())[:5]))

# most congested lines (share of High/Critical in flow, by line via station)
sid_line = {s["station_id"]: s["line_name"] for s in stations}
line_crit = defaultdict(lambda: [0, 0])   # line -> [critical_or_high, total]
for r in flow:
    line = sid_line[r["station_id"]]
    line_crit[line][1] += 1
    if r["crowd_density_level"] in ("High", "Critical"):
        line_crit[line][0] += 1
line_rank = sorted(((l, round(v[0]/v[1]*100,1), v[1]) for l, v in line_crit.items() if v[1] >= 500),
                   key=lambda x: -x[1])[:10]
A["most_congested_lines"] = [{"line": l, "pct_high_or_critical": p, "records": n}
                             for l, p, n in line_rank]
print("  Most congested line:", A["most_congested_lines"][0] if line_rank else None)

# crowd density distribution
dens_dist = Counter(r["crowd_density_level"] for r in flow)
A["crowd_density_distribution"] = dict(dens_dist)

# weekend vs weekday avg (office proxy: IT Hub)
wk = defaultdict(list)
for r in flow:
    is_we = r["weekday"] in ("Saturday", "Sunday")
    wk["weekend" if is_we else "weekday"].append(int(r["total_passengers"]))
A["avg_flow_weekday"] = round(statistics.mean(wk["weekday"]))
A["avg_flow_weekend"] = round(statistics.mean(wk["weekend"]))
print(f"  Avg flow weekday={A['avg_flow_weekday']} weekend={A['avg_flow_weekend']}")

# festival impact (from external_factors impact_percentage)
fest_imp = [float(r["impact_percentage"]) for r in ext if r["festival"] != "None"]
norm_imp = [float(r["impact_percentage"]) for r in ext if r["festival"] == "None" and r["major_event"]=="None" and r["public_holiday"]=="No"]
A["avg_festival_impact_pct"] = round(statistics.mean(fest_imp), 2) if fest_imp else 0
A["avg_normal_impact_pct"] = round(statistics.mean(norm_imp), 2) if norm_imp else 0

# ticket type / payment distribution
A["ticket_type_distribution"] = dict(Counter(r["ticket_type"] for r in tickets))
A["payment_method_distribution"] = dict(Counter(r["payment_method"] for r in tickets))
A["avg_fare"] = round(statistics.mean(int(r["fare_amount"]) for r in tickets), 2)
A["avg_travel_duration_min"] = round(statistics.mean(int(r["travel_duration"]) for r in tickets), 1)

# service status distribution
A["service_status_distribution"] = dict(Counter(r["service_status"] for r in ops))
delays = [int(r["delay_minutes"]) for r in ops if r["delay_minutes"] != ""]
A["avg_delay_minutes"] = round(statistics.mean(delays), 2) if delays else 0

# station counts by metro / category / state
A["stations_by_metro"] = dict(Counter(s["metro_name"] for s in stations))
A["stations_by_category"] = dict(Counter(s["station_category"] for s in stations))
A["stations_by_state"] = dict(Counter(s["state"] for s in stations))
A["interchange_count"] = sum(1 for s in stations if s["interchange_station"] == "Yes")

failed = [c for c in report["checks"] if not c["pass"]]
report["all_checks_passed"] = len(failed) == 0
print(f"\n{'ALL CHECKS PASSED' if not failed else str(len(failed))+' CHECKS FAILED'}")

with open(os.path.join(BASE, "analytics_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)
print("Wrote analytics_report.json")

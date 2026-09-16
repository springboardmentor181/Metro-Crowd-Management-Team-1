# -*- coding: utf-8 -*-
"""
AI MetroFlow - master dataset generator.

Produces 8 relationally-consistent CSVs under MetroFlow_Dataset/ plus a
dataset_summary.json used by the documentation and dashboard.

Design goals (see documentation.pdf for full methodology):
  * Station master is deduplicated by (metro, station_name); interchanges merged.
  * Demand is shaped by station_category, hour-of-day, weekday/weekend, city tier,
    weather, public holidays, festivals and local events.
  * Weather / holidays / festivals / events are generated once per city-day in
    external_factors and JOINED into passenger_flow -> full consistency.
  * Fares derive from real haversine distance between entry/exit stations.
  * metro_ai_training_data is engineered from passenger_flow with lag/rolling
    features and forward-looking targets (ML-ready, no leakage into inputs).
"""

import csv, os, math, json, random
from datetime import date, datetime, timedelta
import numpy as np

from stations_data import METROS, INTERCHANGES, CATEGORY_OVERRIDE

SEED = 42
random.seed(SEED)
RNG = np.random.default_rng(SEED)

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "MetroFlow_Dataset")
os.makedirs(OUT_DIR, exist_ok=True)

# --------------------------------------------------------------------------
# Global configuration
# --------------------------------------------------------------------------
START_DATE = date(2024, 10, 1)
NUM_DAYS = 90                       # 2024-10-01 .. 2024-12-29
DATES = [START_DATE + timedelta(days=i) for i in range(NUM_DAYS)]
OPERATING_HOURS = list(range(5, 24))   # 05:00 .. 23:00 (19 slots)
TOP_STATIONS_PER_CITY = 6              # stations instrumented for hourly flow

METRO_CODE = {
    "Delhi Metro": "DEL", "Noida Metro": "NDA", "Mumbai Metro": "MUM",
    "Pune Metro": "PUN", "Nagpur Metro": "NGP", "Bengaluru Metro": "BLR",
    "Hyderabad Metro": "HYD", "Chennai Metro": "CHN", "Kolkata Metro": "KOL",
    "Ahmedabad Metro": "AMD", "Kochi Metro": "KOC", "Lucknow Metro": "LKO",
    "Jaipur Metro": "JAI", "Kanpur Metro": "KNP", "Agra Metro": "AGR",
    "Bhopal Metro": "BHO", "Indore Metro": "IDR",
}

CITY_TIER = {
    "Delhi": 1.00, "Mumbai": 1.00, "Bengaluru": 0.80, "Hyderabad": 0.75,
    "Kolkata": 0.72, "Chennai": 0.66, "Gurugram": 0.60, "Noida": 0.55,
    "Pune": 0.50, "Howrah": 0.50, "Ahmedabad": 0.46, "Ghaziabad": 0.42,
    "Faridabad": 0.40, "Kochi": 0.40, "Lucknow": 0.40, "Jaipur": 0.40,
    "Nagpur": 0.35, "Greater Noida": 0.32, "Indore": 0.32, "Bhopal": 0.30,
    "Kanpur": 0.30, "Bahadurgarh": 0.25, "Agra": 0.26,
}

CAT_WEIGHT = {
    "Railway Connection": 1.40, "Commercial": 1.20, "IT Hub": 1.15,
    "Airport": 0.95, "Residential": 0.90, "Educational Zone": 0.80,
    "Industrial Area": 0.62,
}

# Hourly demand shape per category (index 0 -> 05:00 ... index 18 -> 23:00)
PROFILES = {
    "Residential":  [1, 3, 7, 10, 9, 5, 3, 2, 2, 2, 3, 4, 6, 9, 10, 8, 5, 3, 1],
    "Commercial":   [1, 2, 4, 8, 10, 8, 5, 4, 4, 4, 4, 5, 7, 9, 10, 8, 5, 3, 2],
    "IT Hub":       [1, 2, 4, 7, 10, 9, 6, 4, 4, 4, 4, 5, 7, 9, 10, 8, 5, 3, 2],
    "Airport":      [4, 5, 6, 6, 6, 5, 5, 5, 5, 5, 5, 6, 6, 7, 7, 7, 7, 6, 5],
    "Educational Zone": [1, 3, 7, 10, 8, 4, 3, 3, 4, 5, 7, 8, 7, 6, 4, 3, 2, 1, 1],
    "Railway Connection": [3, 5, 7, 8, 8, 7, 6, 6, 6, 6, 6, 7, 8, 8, 8, 7, 6, 5, 4],
    "Industrial Area": [2, 5, 9, 10, 7, 4, 3, 3, 4, 4, 4, 5, 7, 9, 8, 5, 3, 2, 1],
}
DEFAULT_PROFILE = "Commercial"
PEAK_HOURS = {8, 9, 10, 18, 19, 20}

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def make_code(name, used):
    letters = [c for c in name.upper() if c.isalpha()]
    base = "".join(letters[:3]) if len(letters) >= 3 else "".join(letters).ljust(3, "X")
    code, i = base, 1
    while code in used:
        i += 1
        code = base[:2] + str(i)
    used.add(code)
    return code


def categorize(name, city):
    for key, cat in CATEGORY_OVERRIDE.items():
        if key.lower() == name.lower() or key.lower() in name.lower():
            return cat
    n = name.lower()
    if "airport" in n:
        return "Airport"
    if any(w in n for w in ["railway", "central", "junction", "isbt", "bus"]):
        return "Railway Connection"
    if any(w in n for w in ["university", "college", "vidyalaya", "iit", "stadium", "vishwavidyalaya"]):
        return "Educational Zone"
    if any(w in n for w in ["industr", "seepz", "midc", "apmc", "mandi", "market"]):
        return "Industrial Area" if "market" not in n else "Commercial"
    r = random.random()
    if r < 0.42:
        return "Residential"
    if r < 0.72:
        return "Commercial"
    if r < 0.85:
        return "IT Hub"
    if r < 0.93:
        return "Educational Zone"
    return "Industrial Area"


def landmark_for(name, cat, city):
    tpl = {
        "Commercial": "Shopping district, offices & markets near {n}",
        "IT Hub": "IT parks & tech offices around {n}",
        "Residential": "Residential colonies & local markets near {n}",
        "Airport": "Airport terminal & cargo complex at {n}",
        "Railway Connection": "Railway station, bus terminal & transit hub at {n}",
        "Educational Zone": "Colleges, coaching centres & hostels near {n}",
        "Industrial Area": "Industrial estate & warehouses near {n}",
    }
    return tpl.get(cat, "Mixed-use area near {n}").format(n=name)


# --------------------------------------------------------------------------
# 1. Build deduplicated station master
# --------------------------------------------------------------------------
print("Building station master ...")
agg = {}   # (metro, name) -> record
line_station_names = {}   # (metro, line) -> ordered list of names

for metro, mdata in METROS.items():
    state = mdata["state"]
    for line, ldata in mdata["lines"].items():
        (la1, lo1), (la2, lo2) = ldata["endpoints"]
        names = ldata["stations"]
        n = len(names)
        line_station_names[(metro, line)] = names
        for i, nm in enumerate(names):
            t = i / max(n - 1, 1)
            jitter_lat = float(RNG.normal(0, 0.0035))
            jitter_lon = float(RNG.normal(0, 0.0035))
            lat = la1 + (la2 - la1) * t + jitter_lat
            lon = lo1 + (lo2 - lo1) * t + jitter_lon
            city = ldata.get("city_map", {}).get(nm, ldata["default_city"])
            key = (metro, nm)
            if key not in agg:
                agg[key] = {
                    "metro": metro, "state": state, "city": city, "name": nm,
                    "lines": [line], "lat": [lat], "lon": [lon],
                    "open": ldata["opening_year"],
                }
            else:
                rec = agg[key]
                if line not in rec["lines"]:
                    rec["lines"].append(line)
                rec["lat"].append(lat)
                rec["lon"].append(lon)
                rec["open"] = min(rec["open"], ldata["opening_year"])

stations = []            # final station master rows (dicts)
name_to_id = {}          # (metro, name) -> station_id
used_codes = {}          # per-metro used codes
sid_counter = {}

for (metro, nm), rec in agg.items():
    code_prefix = METRO_CODE[metro]
    sid_counter[metro] = sid_counter.get(metro, 0) + 1
    station_id = f"{code_prefix}{sid_counter[metro]:03d}"
    used_codes.setdefault(metro, set())
    scode = code_prefix + "-" + make_code(nm, used_codes[metro])
    lat = round(float(np.mean(rec["lat"])), 6)
    lon = round(float(np.mean(rec["lon"])), 6)
    is_inter = "Yes" if (len(rec["lines"]) > 1 or nm in INTERCHANGES) else "No"
    cat = categorize(nm, rec["city"])
    tier = CITY_TIER.get(rec["city"], 0.35)
    cw = CAT_WEIGHT.get(cat, 1.0)
    inter_bonus = 1.9 if is_inter == "Yes" else 1.0
    newness = 0.6 if rec["open"] >= 2022 else (0.85 if rec["open"] >= 2018 else 1.0)
    base = 90000 * tier * cw * inter_bonus * newness * float(RNG.uniform(0.6, 1.4))
    footfall = int(max(600, base))
    platforms = 2
    if is_inter == "Yes":
        platforms = int(RNG.choice([2, 4, 4, 6]))
    elif cat in ("Railway Connection", "Airport"):
        platforms = int(RNG.choice([2, 2, 4]))

    line_name = " / ".join(rec["lines"])
    row = {
        "station_id": station_id, "metro_name": metro, "state": rec["state"],
        "city": rec["city"], "station_name": nm, "station_code": scode,
        "line_name": line_name, "latitude": lat, "longitude": lon,
        "opening_year": rec["open"], "interchange_station": is_inter,
        "platform_count": platforms, "daily_average_footfall": footfall,
        "nearby_landmarks": landmark_for(nm, cat, rec["city"]),
        "station_category": cat,
    }
    stations.append(row)
    name_to_id[(metro, nm)] = station_id

STN = {s["station_id"]: s for s in stations}
# line -> ordered list of station_ids
line_station_ids = {}
for (metro, line), names in line_station_names.items():
    line_station_ids[(metro, line)] = [name_to_id[(metro, nm)] for nm in names]

print(f"  stations (unique): {len(stations)}")

# write master
with open(os.path.join(OUT_DIR, "metro_stations.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    cols = ["station_id", "metro_name", "state", "city", "station_name",
            "station_code", "line_name", "latitude", "longitude", "opening_year",
            "interchange_station", "platform_count", "daily_average_footfall",
            "nearby_landmarks", "station_category"]
    w.writerow(cols)
    for s in stations:
        w.writerow([s[c] for c in cols])

# --------------------------------------------------------------------------
# 2. External factors (city x day)  -> generated FIRST, joined downstream
# --------------------------------------------------------------------------
print("Generating external_factors ...")
cities = sorted({s["city"] for s in stations})
city_state = {s["city"]: s["state"] for s in stations}

# National public holidays in window
PUBLIC_HOLIDAYS = {
    date(2024, 10, 2): "Gandhi Jayanti", date(2024, 10, 12): "Dussehra",
    date(2024, 10, 31): "Diwali", date(2024, 11, 1): "Diwali (Govardhan)",
    date(2024, 11, 15): "Guru Nanak Jayanti", date(2024, 12, 25): "Christmas",
}
FESTIVALS = {
    date(2024, 10, 3): "Navratri Begins", date(2024, 10, 11): "Maha Ashtami",
    date(2024, 10, 12): "Dussehra", date(2024, 10, 29): "Dhanteras",
    date(2024, 10, 31): "Diwali", date(2024, 11, 1): "Govardhan Puja",
    date(2024, 11, 3): "Bhai Dooj", date(2024, 11, 7): "Chhath Puja",
    date(2024, 11, 15): "Kartik Purnima", date(2024, 12, 25): "Christmas",
}
EVENT_TYPES = ["Cricket Match", "Concert", "Political Rally", "Marathon",
               "Trade Fair", "Exam Season", "Film Premiere", "Tech Conference"]

COASTAL = {"Mumbai", "Chennai", "Kochi", "Kolkata", "Howrah"}
NORTH = {"Delhi", "Noida", "Ghaziabad", "Gurugram", "Faridabad", "Bahadurgarh",
         "Greater Noida", "Lucknow", "Kanpur", "Agra", "Jaipur"}

def temp_for(city, m):
    if city in NORTH:
        base = {10: 30, 11: 24, 12: 18}[m]
    elif city in COASTAL:
        base = {10: 31, 11: 30, 12: 28}[m]
    else:
        base = {10: 29, 11: 26, 12: 23}[m]
    return round(base + float(RNG.normal(0, 2.5)), 1)

def weather_for(city, m):
    if city in COASTAL and m == 10:
        opts, wts = ["Clear", "Cloudy", "Rain", "Heavy Rain"], [0.35, 0.3, 0.25, 0.10]
    elif city in NORTH and m == 12:
        opts, wts = ["Clear", "Haze", "Fog", "Cloudy"], [0.4, 0.3, 0.2, 0.1]
    elif city in NORTH and m == 11:
        opts, wts = ["Clear", "Haze", "Cloudy", "Fog"], [0.5, 0.25, 0.15, 0.1]
    else:
        opts, wts = ["Clear", "Cloudy", "Haze", "Rain"], [0.55, 0.25, 0.12, 0.08]
    return random.choices(opts, weights=wts)[0]

ext_rows = []
# city_day_info[(city, date)] = dict used by passenger_flow join
city_day_info = {}
# event_stations[(city, date)] = (event_name, set(station_ids), impact)
event_station_map = {}

flow_station_ids_by_city = {}   # filled later; needed to pick event venues

for d in DATES:
    ph = PUBLIC_HOLIDAYS.get(d, "")
    fest = FESTIVALS.get(d, "")
    for city in cities:
        wx = weather_for(city, d.month)
        temp = temp_for(city, d.month)
        rain = 0.0
        if wx == "Rain":
            rain = round(float(RNG.uniform(2, 25)), 1)
        elif wx == "Heavy Rain":
            rain = round(float(RNG.uniform(25, 90)), 1)

        event = ""
        impact = 0.0
        # base impact from holiday / festival
        if ph:
            impact -= float(RNG.uniform(12, 22))     # offices shut -> net down
        if fest:
            impact += float(RNG.uniform(8, 20))      # festive shopping/temple trips
        # random major event (bigger cities more likely)
        ev_prob = 0.16 * CITY_TIER.get(city, 0.35) + 0.02
        if random.random() < ev_prob:
            event = random.choice(EVENT_TYPES)
            ev_imp = {"Cricket Match": 14, "Concert": 12, "Political Rally": 10,
                      "Marathon": 6, "Trade Fair": 8, "Exam Season": 5,
                      "Film Premiere": 7, "Tech Conference": 6}[event]
            impact += ev_imp + float(RNG.uniform(-2, 3))
        if wx == "Rain":
            impact -= float(RNG.uniform(2, 6))
        elif wx == "Heavy Rain":
            impact -= float(RNG.uniform(8, 16))
        elif wx == "Fog":
            impact -= float(RNG.uniform(3, 8))
        impact = round(impact, 1)

        ext_rows.append([d.isoformat(), city, wx, temp, rain,
                         "Yes" if ph else "No", fest if fest else "None",
                         event if event else "None", impact])
        city_day_info[(city, d)] = {
            "weather": wx, "holiday": 1 if ph else 0, "festival": fest,
            "event": event, "impact": impact, "temp": temp, "rain": rain,
        }

with open(os.path.join(OUT_DIR, "external_factors.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["date", "city", "weather", "temperature", "rainfall",
                "public_holiday", "festival", "major_event", "impact_percentage"])
    w.writerows(ext_rows)
print(f"  external_factors rows: {len(ext_rows)}")

# --------------------------------------------------------------------------
# 3. Passenger flow (monitored stations x day x operating hour)
# --------------------------------------------------------------------------
print("Generating passenger_flow ...")
# pick top-N busiest stations per city as "monitored" (with hourly counters)
by_city = {}
for s in stations:
    by_city.setdefault(s["city"], []).append(s)
monitored = []
for city, lst in by_city.items():
    lst_sorted = sorted(lst, key=lambda x: -x["daily_average_footfall"])
    monitored.extend(lst_sorted[:TOP_STATIONS_PER_CITY])
monitored_ids = [s["station_id"] for s in monitored]
print(f"  monitored stations: {len(monitored)}")

# map city -> monitored station ids (for event venue assignment)
for s in monitored:
    flow_station_ids_by_city.setdefault(s["city"], []).append(s["station_id"])

# assign event venue stations per city-day
for (city, d), info in city_day_info.items():
    if info["event"] and city in flow_station_ids_by_city:
        pool = flow_station_ids_by_city[city]
        k = min(len(pool), int(RNG.integers(1, 3)))
        venues = set(random.sample(pool, k))
        event_station_map[(city, d)] = (info["event"], venues)

def hour_profile(cat):
    p = PROFILES.get(cat, PROFILES[DEFAULT_PROFILE])
    arr = np.array(p, dtype=float)
    return arr / arr.sum()

def entry_share(cat, hour):
    """fraction of throughput that is ENTRY at this station/hour."""
    morning = hour <= 11
    if cat in ("Residential",):
        return 0.66 if morning else (0.5 if 12 <= hour <= 16 else 0.36)
    if cat in ("Commercial", "IT Hub", "Educational Zone", "Industrial Area"):
        return 0.36 if morning else (0.5 if 12 <= hour <= 16 else 0.64)
    return 0.5  # airport / railway / interchange balanced

def weekend_factor(cat, dow):
    is_sat, is_sun = dow == 5, dow == 6
    if not (is_sat or is_sun):
        return 1.0
    if cat in ("IT Hub", "Industrial Area", "Educational Zone"):
        return 0.42 if is_sun else 0.55
    if cat == "Commercial":
        return 0.85 if is_sat else 0.72
    if cat == "Residential":
        return 0.80 if is_sat else 0.70
    return 0.9  # airport / railway steady

def density_level(ratio):
    if ratio < 0.6:
        return "Low"
    if ratio < 1.0:
        return "Medium"
    if ratio < 1.5:
        return "High"
    return "Critical"

flow_path = os.path.join(OUT_DIR, "passenger_flow.csv")
# also collect series in memory for ML feature engineering
series = {sid: [] for sid in monitored_ids}   # sid -> list of dict rows ordered by (date,hour)

rid = 0
n_flow = 0
with open(flow_path, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["record_id", "date", "time", "station_id", "entry_count",
                "exit_count", "total_passengers", "peak_hour_flag", "weekday",
                "holiday_flag", "weather_condition", "event_near_station",
                "crowd_density_level"])
    prof_cache = {}
    for s in monitored:
        sid = s["station_id"]
        cat = s["station_category"]
        city = s["city"]
        daily = s["daily_average_footfall"]
        if cat not in prof_cache:
            prof_cache[cat] = hour_profile(cat)
        prof = prof_cache[cat]
        hour_cap = daily / len(OPERATING_HOURS) * 1.5   # ref capacity per hour
        for d in DATES:
            dow = d.weekday()
            wname = d.strftime("%A")
            info = city_day_info[(city, d)]
            wf = weekend_factor(cat, dow)
            impact_mult = 1.0 + info["impact"] / 100.0
            # festival: commercial/religious up, offices down already in impact
            if info["festival"] and cat in ("Commercial", "Railway Connection"):
                impact_mult *= 1.12
            ev_name, ev_venues = event_station_map.get((city, d), ("", set()))
            is_venue = sid in ev_venues
            venue_mult = 1.0
            if is_venue:
                venue_mult = 1.0 + float(RNG.uniform(0.25, 0.6))
            day_total = daily * wf * max(0.35, impact_mult) * venue_mult
            for hi, hour in enumerate(OPERATING_HOURS):
                frac = prof[hi]
                noise = float(RNG.normal(1.0, 0.10))
                total = day_total * frac * max(0.4, noise)
                # event concentrates around event hours (evening) at venue
                if is_venue and hour in (18, 19, 20, 21):
                    total *= 1.35
                total = int(max(0, round(total)))
                es = entry_share(cat, hour)
                entry = int(round(total * es))
                exit_ = total - entry
                peak = 1 if hour in PEAK_HOURS else 0
                ratio = total / hour_cap if hour_cap > 0 else 0
                dens = density_level(ratio)
                near_event = ev_name if is_venue else "None"
                rid += 1
                tstr = f"{hour:02d}:00"
                w.writerow([f"PF{rid:07d}", d.isoformat(), tstr, sid, entry,
                            exit_, total, peak, wname, info["holiday"],
                            info["weather"], near_event, dens])
                series[sid].append({
                    "date": d, "hour": hour, "total": total, "dens": dens,
                    "weather": info["weather"], "holiday": info["holiday"],
                    "event": near_event, "cat": cat, "city": city,
                })
                n_flow += 1

print(f"  passenger_flow rows: {n_flow}")

# --------------------------------------------------------------------------
# 4. Ticket / smart-card transactions
# --------------------------------------------------------------------------
print("Generating ticket_transactions ...")
N_TICKETS = 65000
ticket_types = ["Smart Card", "QR Ticket", "Token", "Monthly Pass"]
ticket_wts = [0.44, 0.28, 0.18, 0.10]
pax_cats = ["General", "Student", "Senior Citizen", "Women", "Differently-abled", "Tourist"]
pax_wts = [0.60, 0.15, 0.08, 0.10, 0.02, 0.05]
pay_methods = ["UPI", "NCMC Card", "Cash", "Metro App", "Credit/Debit Card"]
pay_wts = [0.38, 0.22, 0.16, 0.14, 0.10]

# stations grouped by metro for intra-network trips, weighted by footfall
metro_station_pool = {}
for s in stations:
    metro_station_pool.setdefault(s["metro_name"], []).append(s)

def fare_for(km, ttype):
    if km <= 2: f = 10
    elif km <= 5: f = 20
    elif km <= 12: f = 30
    elif km <= 21: f = 40
    elif km <= 32: f = 50
    else: f = 60
    if ttype in ("Smart Card", "Monthly Pass"):
        f = round(f * 0.9)
    return f

def sample_hour_weighted():
    # weight toward peaks
    weights = []
    for h in OPERATING_HOURS:
        weights.append(3.0 if h in PEAK_HOURS else (1.0 if 11 <= h <= 16 else 1.6))
    return random.choices(OPERATING_HOURS, weights=weights)[0]

metros_list = list(metro_station_pool.keys())
metro_pick_wts = [sum(s["daily_average_footfall"] for s in metro_station_pool[m]) for m in metros_list]

with open(os.path.join(OUT_DIR, "ticket_transactions.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["transaction_id", "station_id", "timestamp", "ticket_type",
                "passenger_category", "entry_station", "exit_station",
                "travel_duration", "fare_amount", "payment_method"])
    for i in range(1, N_TICKETS + 1):
        metro = random.choices(metros_list, weights=metro_pick_wts)[0]
        pool = metro_station_pool[metro]
        fw = [s["daily_average_footfall"] for s in pool]
        a = random.choices(pool, weights=fw)[0]
        b = random.choices(pool, weights=fw)[0]
        tries = 0
        while b["station_id"] == a["station_id"] and tries < 5:
            b = random.choices(pool, weights=fw)[0]
            tries += 1
        km = haversine(a["latitude"], a["longitude"], b["latitude"], b["longitude"])
        km = max(0.8, km)
        ttype = random.choices(ticket_types, weights=ticket_wts)[0]
        fare = fare_for(km, ttype)
        dur = int(round(km / 32.0 * 60 + random.uniform(3, 8)))  # + access/wait
        d = random.choice(DATES)
        hour = sample_hour_weighted()
        minute = random.randint(0, 59)
        ts = datetime(d.year, d.month, d.day, hour, minute).isoformat(sep=" ")
        pcat = random.choices(pax_cats, weights=pax_wts)[0]
        pay = random.choices(pay_methods, weights=pay_wts)[0]
        if ttype == "Token":
            pay = "Cash" if random.random() < 0.5 else pay
        w.writerow([f"TXN{i:08d}", a["station_id"], ts, ttype, pcat,
                    a["station_name"], b["station_name"], dur, fare, pay])
print(f"  ticket_transactions rows: {N_TICKETS}")

# --------------------------------------------------------------------------
# 5. Train operations  (line x sampled day x train run x stop)
# --------------------------------------------------------------------------
print("Generating train_operations ...")
def headway_for(city_tier, hour):
    peak = hour in PEAK_HOURS
    if city_tier >= 0.8:
        return random.choice([2, 3]) if peak else random.choice([4, 5, 6])
    if city_tier >= 0.5:
        return random.choice([3, 4]) if peak else random.choice([6, 8])
    return random.choice([5, 7]) if peak else random.choice([10, 12, 15])

def occ_from_profile(cat, hour):
    prof = PROFILES.get(cat, PROFILES[DEFAULT_PROFILE])
    hi = hour - 5
    base = prof[hi] / max(prof) * 100
    return base

op_rows = 0
sample_days = [DATES[i] for i in range(0, NUM_DAYS, max(1, NUM_DAYS // 10))][:10]
with open(os.path.join(OUT_DIR, "train_operations.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["train_id", "metro_name", "line_name", "station_id",
                "arrival_time", "departure_time", "scheduled_time", "actual_time",
                "delay_minutes", "train_frequency", "occupancy_percentage",
                "service_status"])
    run_counter = 0
    for (metro, line), sids in line_station_ids.items():
        if len(sids) < 2:
            continue
        tier = CITY_TIER.get(STN[sids[0]]["city"], 0.35)
        for d in sample_days:
            for run in range(6):
                run_counter += 1
                direction = sids if run % 2 == 0 else list(reversed(sids))
                train_id = f"{METRO_CODE[metro]}-{line[:2].upper()}-{run_counter:05d}"
                start_hour = random.choice([6, 8, 9, 13, 17, 19, 21])
                cur = datetime(d.year, d.month, d.day, start_hour, random.randint(0, 59))
                freq = headway_for(tier, start_hour)
                # service status for whole run
                roll = random.random()
                if roll < 0.80: status = "Running"
                elif roll < 0.93: status = "Delayed"
                elif roll < 0.97: status = "Maintenance"
                else: status = "Cancelled"
                if status == "Cancelled":
                    # single record for the run
                    sid = direction[0]
                    sched = cur
                    w.writerow([train_id, metro, line, sid,
                                "", "", sched.strftime("%H:%M:%S"), "",
                                "", freq, 0, "Cancelled"])
                    op_rows += 1
                    continue
                accumulated_delay = 0
                for sid in direction:
                    scheduled = cur
                    if status == "Delayed":
                        accumulated_delay += random.choice([0, 0, 1, 1, 2, 3])
                    else:
                        accumulated_delay += random.choice([0, 0, 0, 0, 1])
                    actual = scheduled + timedelta(minutes=accumulated_delay)
                    dwell = random.choice([20, 25, 30, 35])
                    departure = actual + timedelta(seconds=dwell)
                    cat = STN[sid]["station_category"]
                    occ = occ_from_profile(cat, actual.hour if actual.hour >= 5 else 5)
                    occ = int(min(135, max(5, occ * random.uniform(0.75, 1.2) *
                                            (1.15 if tier >= 0.8 else 1.0))))
                    st = "Delayed" if (status == "Delayed" and accumulated_delay >= 2) else "Running"
                    if status == "Maintenance":
                        st = "Running"
                    w.writerow([train_id, metro, line, sid,
                                actual.strftime("%H:%M:%S"),
                                departure.strftime("%H:%M:%S"),
                                scheduled.strftime("%H:%M:%S"),
                                actual.strftime("%H:%M:%S"),
                                accumulated_delay, freq, occ, st])
                    op_rows += 1
                    cur = departure + timedelta(minutes=random.choice([2, 2, 3]))
print(f"  train_operations rows: {op_rows}")

# --------------------------------------------------------------------------
# 6. Train occupancy (train x day x time x station sample)
# --------------------------------------------------------------------------
print("Generating train_occupancy ...")
def coach_capacity(city_tier):
    if city_tier >= 0.9:
        coaches = random.choice([6, 8])
        return coaches * random.choice([320, 350, 380])
    if city_tier >= 0.6:
        coaches = random.choice([6, 6, 3])
        return coaches * random.choice([300, 320])
    coaches = random.choice([3, 3, 4])
    return coaches * random.choice([280, 300])

def crowd_from_occ(o):
    if o < 45: return "Low"
    if o < 80: return "Medium"
    if o < 105: return "High"
    return "Critical"

occ_rows = 0
occ_sample_days = [DATES[i] for i in range(0, NUM_DAYS, 4)]   # ~23 days
with open(os.path.join(OUT_DIR, "train_occupancy.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["train_id", "date", "time", "station_id", "coach_capacity",
                "current_passengers", "occupancy_percentage", "crowd_level"])
    tcount = 0
    for (metro, line), sids in line_station_ids.items():
        if len(sids) < 2:
            continue
        tier = CITY_TIER.get(STN[sids[0]]["city"], 0.35)
        for d in occ_sample_days:
            for run in range(3):
                tcount += 1
                train_id = f"{METRO_CODE[metro]}-{line[:2].upper()}-OCC{tcount:05d}"
                cap = coach_capacity(tier)
                hour = random.choices(OPERATING_HOURS,
                                      weights=[3 if h in PEAK_HOURS else 1 for h in OPERATING_HOURS])[0]
                # sample a handful of stations along the run
                sample_sids = random.sample(sids, min(len(sids), random.randint(3, 6)))
                for sid in sample_sids:
                    cat = STN[sid]["station_category"]
                    base_occ = occ_from_profile(cat, hour)
                    occ = base_occ * random.uniform(0.7, 1.25) * (1.15 if tier >= 0.85 else 1.0)
                    occ = min(140, max(5, occ))
                    cur = int(cap * occ / 100.0)
                    w.writerow([train_id, d.isoformat(), f"{hour:02d}:{random.randint(0,59):02d}",
                                sid, cap, cur, round(occ, 1), crowd_from_occ(occ)])
                    occ_rows += 1
print(f"  train_occupancy rows: {occ_rows}")

# --------------------------------------------------------------------------
# 7. Schedule optimization (metro/line x time-slot x day-type)
# --------------------------------------------------------------------------
print("Generating train_schedule ...")
TIME_SLOTS = [("05:00-07:00", 6), ("07:00-10:00", 8), ("10:00-13:00", 11),
              ("13:00-16:00", 14), ("16:00-18:00", 17), ("18:00-21:00", 19),
              ("21:00-23:00", 22)]
sched_rows = 0
sid_ctr = 0
with open(os.path.join(OUT_DIR, "train_schedule.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["schedule_id", "metro_name", "line_name", "time_slot",
                "current_frequency", "recommended_frequency", "passenger_demand",
                "delay_probability", "optimization_score"])
    for (metro, line), sids in line_station_ids.items():
        tier = CITY_TIER.get(STN[sids[0]]["city"], 0.35)
        line_daily = sum(STN[s]["daily_average_footfall"] for s in sids)
        for daytype in ("Weekday", "Weekend"):
            for slot_label, rep_hour in TIME_SLOTS:
                sid_ctr += 1
                cur_freq = headway_for(tier, rep_hour)
                # demand index 0..100
                cat_mix = np.mean([PROFILES.get(STN[s]["station_category"],
                                   PROFILES[DEFAULT_PROFILE])[rep_hour - 5] for s in sids])
                demand = cat_mix / 10.0 * (line_daily / 1e6) * 40 * tier
                if daytype == "Weekend":
                    demand *= 0.7
                demand = round(min(100, max(3, demand + random.uniform(-4, 4))), 1)
                # recommend lower headway (more trains) when demand high
                if demand > 70:
                    rec = max(2, cur_freq - random.choice([1, 2]))
                elif demand < 25:
                    rec = cur_freq + random.choice([1, 2, 3])
                else:
                    rec = cur_freq + random.choice([-1, 0, 0, 1])
                rec = max(2, rec)
                delay_prob = round(min(0.95, max(0.02,
                              0.05 + demand / 200.0 + (0.08 if rep_hour in PEAK_HOURS else 0)
                              + random.uniform(-0.03, 0.05))), 3)
                # optimization score: high when current freq already matches demand
                mismatch = abs(cur_freq - rec) / max(cur_freq, 1)
                opt = round(max(0, 100 - mismatch * 60 - delay_prob * 40 + random.uniform(-5, 5)), 1)
                w.writerow([f"SCH{sid_ctr:05d}", metro, line, f"{daytype} {slot_label}",
                            cur_freq, rec, demand, delay_prob, opt])
                sched_rows += 1
print(f"  train_schedule rows: {sched_rows}")

# --------------------------------------------------------------------------
# 8. ML-ready training dataset (engineered from passenger_flow series)
# --------------------------------------------------------------------------
print("Generating metro_ai_training_data ...")
def freq_recommend(dens_next):
    return {"Low": 12, "Medium": 8, "High": 5, "Critical": 3}[dens_next]

ai_rows = 0
with open(os.path.join(OUT_DIR, "metro_ai_training_data.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["station_id", "date", "hour", "day_of_week",
                "previous_hour_passengers", "previous_day_average",
                "weather", "holiday", "event", "train_frequency", "occupancy",
                "future_crowd_level", "future_passenger_count",
                "recommended_train_frequency", "congestion_probability"])
    for sid, rows in series.items():
        cat = STN[sid]["station_category"]
        tier = CITY_TIER.get(STN[sid]["city"], 0.35)
        # index by (date,hour)
        rows_sorted = sorted(rows, key=lambda r: (r["date"], r["hour"]))
        # daily averages
        day_tot, day_cnt = {}, {}
        for r in rows_sorted:
            day_tot[r["date"]] = day_tot.get(r["date"], 0) + r["total"]
            day_cnt[r["date"]] = day_cnt.get(r["date"], 0) + 1
        for idx, r in enumerate(rows_sorted):
            prev = rows_sorted[idx - 1]["total"] if idx > 0 and \
                rows_sorted[idx - 1]["date"] == r["date"] else r["total"]
            prev_day = r["date"] - timedelta(days=1)
            prev_day_avg = round(day_tot.get(prev_day, r["total"] * len(OPERATING_HOURS)) /
                                 max(1, day_cnt.get(prev_day, len(OPERATING_HOURS))), 1)
            nxt = rows_sorted[idx + 1] if idx + 1 < len(rows_sorted) and \
                rows_sorted[idx + 1]["date"] == r["date"] else None
            future_dens = nxt["dens"] if nxt else r["dens"]
            future_cnt = nxt["total"] if nxt else r["total"]
            freq = headway_for(tier, r["hour"])
            occ = int(min(135, max(5, occ_from_profile(cat, r["hour"]) *
                                   (1.15 if tier >= 0.85 else 1.0) * random.uniform(0.8, 1.15))))
            congestion_prob = round(min(0.98, {"Low": 0.05, "Medium": 0.25,
                                                "High": 0.6, "Critical": 0.9}[future_dens]
                                        + random.uniform(-0.04, 0.06)), 3)
            w.writerow([sid, r["date"].isoformat(), r["hour"],
                        r["date"].strftime("%A"), prev, prev_day_avg,
                        r["weather"], r["holiday"], r["event"], freq, occ,
                        future_dens, future_cnt, freq_recommend(future_dens),
                        congestion_prob])
            ai_rows += 1
print(f"  metro_ai_training_data rows: {ai_rows}")

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
summary = {
    "generated_at_window": f"{START_DATE.isoformat()} to {DATES[-1].isoformat()}",
    "num_days": NUM_DAYS,
    "counts": {
        "metro_stations": len(stations),
        "passenger_flow": n_flow,
        "ticket_transactions": N_TICKETS,
        "train_operations": op_rows,
        "train_occupancy": occ_rows,
        "external_factors": len(ext_rows),
        "train_schedule": sched_rows,
        "metro_ai_training_data": ai_rows,
    },
    "monitored_stations": len(monitored),
    "cities": len(cities),
    "metros": len(METROS),
}
summary["counts"]["TOTAL"] = sum(summary["counts"].values())
with open(os.path.join(OUT_DIR, "dataset_summary.json"), "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

print("\n=== DONE ===")
print(json.dumps(summary["counts"], indent=2))
print("TOTAL records:", summary["counts"]["TOTAL"])

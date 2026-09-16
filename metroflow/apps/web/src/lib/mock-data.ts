/**
 * Dashboard mock data — values sourced from the real dataset's
 * analytics_report.json (Planning Doc 03). Replaced by live FastAPI calls
 * (Doc 11) once the backend is running; shape matches the API responses.
 */
import type { CrowdLevel } from "@/lib/utils";

export const KPIS = {
  networkLoad: 63.4,
  networkLoadTrend: -1.1,
  activeAlerts: 7,
  onTime: 88.0,
  onTimeTrend: 0.6,
  footfallToday: 4210233,
  footfallTrend: 4.2,
};

// passengers by hour (aggregated), from analytics_report.json
export const PASSENGERS_BY_HOUR: { hour: string; passengers: number; typical: number }[] = [
  ["05", 10945016], ["06", 21562883], ["07", 39814530], ["08", 64842317],
  ["09", 74511900], ["10", 58789553], ["11", 39412284], ["12", 32203747],
  ["13", 32367023], ["14", 32589864], ["15", 33955456], ["16", 41872837],
  ["17", 55665246], ["18", 70036967], ["19", 76252244], ["20", 61889620],
  ["21", 41229549], ["22", 26424839], ["23", 17601394],
].map(([h, p]) => ({
  hour: `${h}:00`,
  passengers: Math.round((p as number) / 1000),
  typical: Math.round(((p as number) / 1000) * (0.9 + ((Number(h) % 5) * 0.03))),
}));

export const CROWD_DISTRIBUTION: { level: CrowdLevel; count: number }[] = [
  { level: "Low", count: 120658 },
  { level: "Medium", count: 66091 },
  { level: "High", count: 34496 },
  { level: "Critical", count: 2765 },
];

export const TOP_FOOTFALL = [
  { station: "Central Secretariat", metro: "Delhi Metro", footfall: 306017 },
  { station: "New Delhi", metro: "Delhi Metro", footfall: 303868 },
  { station: "Mayur Vihar Phase-1", metro: "Delhi Metro", footfall: 274696 },
  { station: "Dwarka Sector 21", metro: "Delhi Metro", footfall: 273044 },
  { station: "Azadpur", metro: "Delhi Metro", footfall: 272277 },
  { station: "Anand Vihar ISBT", metro: "Delhi Metro", footfall: 269077 },
  { station: "Hauz Khas", metro: "Delhi Metro", footfall: 265682 },
  { station: "Welcome", metro: "Delhi Metro", footfall: 265516 },
];

export const CITY_FLOW = [
  { city: "Delhi", flow: 1697926 }, { city: "Mumbai", flow: 907555 },
  { city: "Bengaluru", flow: 748620 }, { city: "Hyderabad", flow: 733628 },
  { city: "Chennai", flow: 701295 }, { city: "Kolkata", flow: 643676 },
  { city: "Gurugram", flow: 416465 }, { city: "Kochi", flow: 355684 },
];

export const CONGESTED_LINES = [
  { line: "Blue / Magenta", pct: 22.7 },
  { line: "Blue / Red", pct: 19.4 },
  { line: "Blue / Airport Express", pct: 19.2 },
  { line: "Purple Line", pct: 19.0 },
  { line: "Violet Line", pct: 18.3 },
];

// Peak-hours grid: crowd load per hour for a representative station
export const PEAK_HOURS: { hour: string; pct: number; level: CrowdLevel }[] = [
  { hour: "07:00", pct: 62, level: "High" },
  { hour: "08:00", pct: 85, level: "Critical" },
  { hour: "09:00", pct: 96, level: "Critical" },
  { hour: "10:00", pct: 74, level: "High" },
  { hour: "11:00", pct: 48, level: "Medium" },
  { hour: "12:00", pct: 39, level: "Low" },
  { hour: "17:00", pct: 71, level: "High" },
  { hour: "18:00", pct: 90, level: "Critical" },
  { hour: "19:00", pct: 98, level: "Critical" },
  { hour: "20:00", pct: 79, level: "High" },
];

// Congestion heatmap: 8 stations x hours (0-1 probability)
export const HEATMAP_STATIONS = [
  "Central Secretariat", "New Delhi", "Rajiv Chowk", "Kashmere Gate",
  "Hauz Khas", "Dwarka Sec 21", "Azadpur", "Welcome",
];
export const HEATMAP_HOURS = ["06", "08", "10", "12", "14", "16", "18", "20", "22"];
export const HEATMAP: number[][] = HEATMAP_STATIONS.map((_, r) =>
  HEATMAP_HOURS.map((h, c) => {
    const peak = [1, 7].includes(c) ? 0.55 : 0.15; // 08:00 & 20:00 columns
    const base = ((r * 13 + c * 7) % 10) / 20;
    return Math.min(0.98, Number((peak + base + (c === 6 ? 0.3 : 0)).toFixed(2)));
  })
);

export type Alert = {
  id: string;
  type: "overcrowding" | "delay" | "emergency";
  severity: CrowdLevel;
  station: string;
  line: string;
  message: string;
  ago: string;
  status: "open" | "acknowledged";
};

export const ALERTS: Alert[] = [
  { id: "a1", type: "overcrowding", severity: "Critical", station: "Rajiv Chowk", line: "Blue Line", message: "Critical crowding — platform 2 at 98% occupancy", ago: "2m", status: "open" },
  { id: "a2", type: "overcrowding", severity: "High", station: "Central Secretariat", line: "Yellow Line", message: "High density detected during evening peak", ago: "6m", status: "open" },
  { id: "a3", type: "delay", severity: "Medium", station: "Kashmere Gate", line: "Red Line", message: "Train DEL-RE-00214 delayed 7 min", ago: "11m", status: "open" },
  { id: "a4", type: "overcrowding", severity: "High", station: "New Delhi", line: "Airport Express", message: "Surge inflow from railway interchange", ago: "18m", status: "acknowledged" },
  { id: "a5", type: "delay", severity: "Low", station: "Hauz Khas", line: "Magenta Line", message: "Minor headway irregularity", ago: "24m", status: "acknowledged" },
];

export const SCHEDULE_RECOS = [
  { line: "Blue Line", slot: "Weekday 07:00–10:00", current: 4, recommended: 3, score: 89.2, demand: 100 },
  { line: "Yellow Line", slot: "Weekday 17:00–20:00", current: 4, recommended: 3, score: 84.0, demand: 92 },
  { line: "Airport Express", slot: "Weekday 08:00–11:00", current: 6, recommended: 5, score: 78.5, demand: 71 },
  { line: "Magenta Line", slot: "Weekend 18:00–21:00", current: 6, recommended: 6, score: 91.4, demand: 48 },
];

export const SERVICE_STATUS = [
  { status: "Running", count: 38965 },
  { status: "Delayed", count: 5308 },
  { status: "Cancelled", count: 60 },
];

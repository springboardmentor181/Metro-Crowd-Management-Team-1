-- MetroFlow — schema (Planning Doc 08). Run in Supabase SQL editor or via psql.
-- Creates dataset tables (seeded from the 8 CSVs) + application tables + enums.

-- ===== enums =====
do $$ begin
  create type user_role      as enum ('admin','operator');
  create type alert_type     as enum ('overcrowding','delay','emergency');
  create type alert_severity as enum ('low','medium','high','critical','emergency');
  create type alert_status   as enum ('open','acknowledged','resolved');
  create type crowd_level    as enum ('Low','Medium','High','Critical');
  create type reco_status    as enum ('proposed','applied','dismissed');
exception when duplicate_object then null; end $$;

-- ===== dataset (reference) tables =====
create table if not exists public.metro_stations (
  station_id text primary key,
  metro_name text, state text, city text, station_name text, station_code text,
  line_name text, latitude double precision, longitude double precision,
  opening_year int, interchange_station text, platform_count int,
  daily_average_footfall int, nearby_landmarks text, station_category text
);

create table if not exists public.passenger_flow (
  record_id text primary key,
  date date, "time" text, station_id text references public.metro_stations(station_id),
  entry_count int, exit_count int, total_passengers int, peak_hour_flag int,
  weekday text, holiday_flag int, weather_condition text, event_near_station text,
  crowd_density_level text
);

create table if not exists public.ticket_transactions (
  transaction_id text primary key, station_id text references public.metro_stations(station_id),
  "timestamp" timestamptz, ticket_type text, passenger_category text,
  entry_station text, exit_station text, travel_duration int, fare_amount int, payment_method text
);

create table if not exists public.train_operations (
  train_id text, metro_name text, line_name text,
  station_id text references public.metro_stations(station_id),
  arrival_time text, departure_time text, scheduled_time text, actual_time text,
  delay_minutes int, train_frequency int, occupancy_percentage int, service_status text
);

create table if not exists public.train_occupancy (
  train_id text, date date, "time" text,
  station_id text references public.metro_stations(station_id),
  coach_capacity int, current_passengers int, occupancy_percentage double precision, crowd_level text
);

create table if not exists public.external_factors (
  date date, city text, weather text, temperature double precision, rainfall double precision,
  public_holiday text, festival text, major_event text, impact_percentage double precision
);

create table if not exists public.train_schedule (
  schedule_id text primary key, metro_name text, line_name text, time_slot text,
  current_frequency int, recommended_frequency int, passenger_demand double precision,
  delay_probability double precision, optimization_score double precision
);

-- ===== application tables =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, role user_role not null default 'operator',
  avatar_url text, assigned_network text, is_active boolean not null default true,
  last_active_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type alert_type not null, severity alert_severity not null,
  station_id text references public.metro_stations(station_id), line_name text,
  message text not null, status alert_status not null default 'open',
  acknowledged_by uuid references public.profiles(id), acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.prediction_history (
  id uuid primary key default gen_random_uuid(),
  station_id text references public.metro_stations(station_id), target_hour timestamptz,
  crowd_level crowd_level, passenger_count int, congestion_probability real,
  recommended_frequency int, confidence real, model_version text,
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_recommendations (
  id uuid primary key default gen_random_uuid(),
  schedule_id text references public.train_schedule(schedule_id), line_name text, time_slot text,
  current_frequency int, recommended_frequency int, optimization_score real,
  status reco_status not null default 'proposed',
  decided_by uuid references public.profiles(id), decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.profiles(id), action text not null, entity text,
  entity_id text, payload jsonb, created_at timestamptz not null default now()
);

-- ===== indexes =====
create index if not exists ix_flow_station_date on public.passenger_flow(station_id, date);
create index if not exists ix_flow_density on public.passenger_flow(crowd_density_level);
create index if not exists ix_txn_station on public.ticket_transactions(station_id);
create index if not exists ix_ops_line_station on public.train_operations(line_name, station_id);
create index if not exists ix_occ_station on public.train_occupancy(station_id);
create index if not exists ix_alerts_open on public.alerts(status) where status = 'open';
create index if not exists ix_pred_station on public.prediction_history(station_id, target_hour);

-- ===== new-user trigger: create a profile row =====
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          coalesce((new.raw_user_meta_data->>'role')::user_role, 'operator'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

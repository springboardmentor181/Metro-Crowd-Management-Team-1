-- MetroFlow — Row-Level Security (Planning Doc 19). Run after 001_schema.sql.

create or replace function public.auth_role() returns text language sql stable as
$$ select role::text from public.profiles where id = auth.uid() $$;

create or replace function public.auth_network() returns text language sql stable as
$$ select assigned_network from public.profiles where id = auth.uid() $$;

-- profiles: self read/update; admin all
alter table public.profiles enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.auth_role() = 'admin');
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid());
drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- dataset tables: any authenticated user may read
do $$
declare t text;
begin
  foreach t in array array['metro_stations','passenger_flow','ticket_transactions',
    'train_operations','train_occupancy','external_factors','train_schedule']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.role() = ''authenticated'');', t, t);
  end loop;
end $$;

-- alerts: read authenticated; operators/admin ack; admin insert (emergency broadcast)
alter table public.alerts enable row level security;
drop policy if exists alerts_read on public.alerts;
create policy alerts_read on public.alerts for select using (auth.role() = 'authenticated');
drop policy if exists alerts_ack on public.alerts;
create policy alerts_ack on public.alerts for update using (public.auth_role() in ('admin','operator'))
  with check (status in ('acknowledged','resolved'));
drop policy if exists alerts_admin_insert on public.alerts;
create policy alerts_admin_insert on public.alerts for insert with check (public.auth_role() = 'admin');

-- schedule recommendations: read all; only admin may apply/dismiss
alter table public.schedule_recommendations enable row level security;
drop policy if exists reco_read on public.schedule_recommendations;
create policy reco_read on public.schedule_recommendations for select using (auth.role() = 'authenticated');
drop policy if exists reco_decide on public.schedule_recommendations;
create policy reco_decide on public.schedule_recommendations for update using (public.auth_role() = 'admin');

-- prediction history: read authenticated (writes via service role)
alter table public.prediction_history enable row level security;
drop policy if exists pred_read on public.prediction_history;
create policy pred_read on public.prediction_history for select using (auth.role() = 'authenticated');

-- audit log: admin read; insert allowed (service role / triggers)
alter table public.audit_log enable row level security;
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select using (public.auth_role() = 'admin');
drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log for insert with check (true);

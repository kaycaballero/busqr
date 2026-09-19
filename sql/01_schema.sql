-- =====================================================================
-- ESQUEMA COMPLETO - Sistema de Validacion de Boletos de Bus
-- Copia y pega TODO este archivo en el SQL Editor de Supabase
-- y presiona "Run". Se ejecuta una sola vez.
-- =====================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('admin', 'operator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trip_status as enum ('SCHEDULED', 'ACTIVE', 'FINISHED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('AVAILABLE', 'USED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boarding_kind as enum ('BOARDING', 'REENTRY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type validation_result as enum (
    'AUTHORIZED', 'ALREADY_USED', 'EXPIRED', 'INVALID_CODE',
    'WRONG_TRIP', 'TRIP_NOT_ACTIVE', 'CANCELLED',
    'PASSENGER_NOT_FOUND', 'UNAUTHORIZED', 'SYSTEM_ERROR'
  );
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role user_role not null default 'operator',
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists passengers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  document_number text not null,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  origin text not null,
  destination text not null,
  active boolean not null default true
);

create table if not exists buses (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  code text,
  capacity int,
  active boolean not null default true
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id),
  bus_id uuid not null references buses(id),
  departure_at timestamptz not null,
  arrival_at timestamptz not null,
  status trip_status not null default 'SCHEDULED',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists trip_assignments (
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (trip_id, user_id)
);

create sequence if not exists ticket_number_seq;

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('T-' || lpad(nextval('ticket_number_seq')::text, 6, '0')),
  code text not null unique default encode(gen_random_bytes(16), 'hex'),
  passenger_id uuid not null references passengers(id),
  trip_id uuid not null references trips(id),
  status ticket_status not null default 'AVAILABLE',
  used_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create table if not exists boarding_records (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id),
  passenger_id uuid not null references passengers(id),
  trip_id uuid not null references trips(id),
  route_id uuid not null references routes(id),
  bus_id uuid not null references buses(id),
  operator_id uuid not null references profiles(id),
  kind boarding_kind not null,
  validation_log_id uuid,
  latitude double precision,
  longitude double precision,
  boarded_at timestamptz not null default now()
);

create table if not exists validation_logs (
  id uuid primary key default gen_random_uuid(),
  scanned_at timestamptz not null default now(),
  operator_id uuid not null references profiles(id),
  received_code text not null,
  ticket_id uuid references tickets(id),
  passenger_id uuid references passengers(id),
  trip_id uuid references trips(id),
  route_id uuid references routes(id),
  bus_id uuid references buses(id),
  assigned_trip_id uuid references trips(id),
  result validation_result not null,
  latitude double precision,
  longitude double precision,
  details jsonb,
  confirmed_at timestamptz
);

do $$ begin
  alter table boarding_records
    add constraint boarding_records_validation_log_fk
    foreign key (validation_log_id) references validation_logs(id);
exception when duplicate_object then null; end $$;

create index if not exists idx_tickets_trip on tickets(trip_id);
create index if not exists idx_tickets_passenger on tickets(passenger_id);
create unique index if not exists idx_boarding_unique_boarding
  on boarding_records(ticket_id) where kind = 'BOARDING';
create index if not exists idx_vlogs_scanned_at on validation_logs(scanned_at);
create index if not exists idx_vlogs_operator_scanned on validation_logs(operator_id, scanned_at);
create index if not exists idx_vlogs_result on validation_logs(result);
create index if not exists idx_vlogs_trip on validation_logs(trip_id);
create index if not exists idx_vlogs_code on validation_logs(received_code);
create index if not exists idx_assignments_user on trip_assignments(user_id);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'operator',
    false
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function prevent_ticket_reset()
returns trigger as $$
begin
  if old.status = 'USED' and new.status = 'AVAILABLE' then
    raise exception 'No se permite devolver un boleto usado a disponible.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_ticket_reset on tickets;
create trigger trg_prevent_ticket_reset
  before update on tickets
  for each row execute function prevent_ticket_reset();

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and active = true
  );
$$ language sql security definer set search_path = public stable;

create or replace function is_active_operator()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and active = true
  );
$$ language sql security definer set search_path = public stable;

create or replace function current_assigned_trip_id()
returns uuid as $$
  select t.id
  from trip_assignments ta
  join trips t on t.id = ta.trip_id
  where ta.user_id = auth.uid()
  order by (t.status = 'ACTIVE') desc, t.departure_at desc
  limit 1;
$$ language sql security definer set search_path = public stable;

alter table profiles enable row level security;
alter table passengers enable row level security;
alter table routes enable row level security;
alter table buses enable row level security;
alter table trips enable row level security;
alter table trip_assignments enable row level security;
alter table tickets enable row level security;
alter table boarding_records enable row level security;
alter table validation_logs enable row level security;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());

drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles for update
  using (is_admin() and id <> auth.uid())
  with check (is_admin() and id <> auth.uid());

drop policy if exists passengers_admin_all on passengers;
create policy passengers_admin_all on passengers for all
  using (is_admin()) with check (is_admin());

drop policy if exists routes_admin_write on routes;
create policy routes_admin_write on routes for all
  using (is_admin()) with check (is_admin());
drop policy if exists routes_operator_read on routes;
create policy routes_operator_read on routes for select
  using (is_active_operator());

drop policy if exists buses_admin_write on buses;
create policy buses_admin_write on buses for all
  using (is_admin()) with check (is_admin());
drop policy if exists buses_operator_read on buses;
create policy buses_operator_read on buses for select
  using (is_active_operator());

drop policy if exists trips_admin_write on trips;
create policy trips_admin_write on trips for all
  using (is_admin()) with check (is_admin());
drop policy if exists trips_operator_read on trips;
create policy trips_operator_read on trips for select
  using (
    is_active_operator() and exists (
      select 1 from trip_assignments ta
      where ta.trip_id = trips.id and ta.user_id = auth.uid()
    )
  );

drop policy if exists assignments_admin_write on trip_assignments;
create policy assignments_admin_write on trip_assignments for all
  using (is_admin()) with check (is_admin());
drop policy if exists assignments_operator_read on trip_assignments;
create policy assignments_operator_read on trip_assignments for select
  using (user_id = auth.uid());

drop policy if exists tickets_admin_all on tickets;
create policy tickets_admin_all on tickets for all
  using (is_admin()) with check (is_admin());

drop policy if exists boarding_admin_read on boarding_records;
create policy boarding_admin_read on boarding_records for select
  using (is_admin());
drop policy if exists boarding_operator_read on boarding_records;
create policy boarding_operator_read on boarding_records for select
  using (operator_id = auth.uid());

drop policy if exists vlogs_admin_read on validation_logs;
create policy vlogs_admin_read on validation_logs for select
  using (is_admin());
drop policy if exists vlogs_operator_read on validation_logs;
create policy vlogs_operator_read on validation_logs for select
  using (operator_id = auth.uid());

create or replace function validate_ticket(p_code text, p_lat double precision default null, p_lon double precision default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_trip_id uuid;
  v_ticket tickets%rowtype;
  v_trip trips%rowtype;
  v_passenger passengers%rowtype;
  v_result validation_result;
  v_log_id uuid;
  v_prior_boarding boarding_records%rowtype;
  v_details jsonb := '{}'::jsonb;
begin
  select * into v_profile from profiles where id = auth.uid();

  if v_profile.id is null or v_profile.active = false then
    v_result := 'UNAUTHORIZED';
    insert into validation_logs(operator_id, received_code, result, latitude, longitude, details)
    values (auth.uid(), p_code, v_result, p_lat, p_lon, jsonb_build_object('reason','perfil inactivo o inexistente'))
    returning id into v_log_id;
    return jsonb_build_object('result', v_result, 'validation_log_id', v_log_id);
  end if;

  v_trip_id := current_assigned_trip_id();

  if v_trip_id is null then
    v_result := 'UNAUTHORIZED';
    insert into validation_logs(operator_id, received_code, result, latitude, longitude, details)
    values (auth.uid(), p_code, v_result, p_lat, p_lon, jsonb_build_object('reason','sin viaje asignado'))
    returning id into v_log_id;
    return jsonb_build_object('result', v_result, 'validation_log_id', v_log_id);
  end if;

  select * into v_ticket from tickets where code = p_code;

  if v_ticket.id is null then
    v_result := 'INVALID_CODE';
    insert into validation_logs(operator_id, received_code, assigned_trip_id, result, latitude, longitude)
    values (auth.uid(), p_code, v_trip_id, v_result, p_lat, p_lon)
    returning id into v_log_id;
    return jsonb_build_object('result', v_result, 'validation_log_id', v_log_id);
  end if;

  select * into v_trip from trips where id = v_ticket.trip_id;
  select * into v_passenger from passengers where id = v_ticket.passenger_id;

  if v_ticket.status = 'CANCELLED' then
    v_result := 'CANCELLED';
  elsif v_passenger.id is null or v_passenger.active = false then
    v_result := 'PASSENGER_NOT_FOUND';
  elsif v_ticket.trip_id <> v_trip_id then
    v_result := 'WRONG_TRIP';
  elsif v_trip.status = 'FINISHED' or now() > v_trip.arrival_at then
    v_result := 'EXPIRED';
  elsif v_trip.status <> 'ACTIVE' then
    v_result := 'TRIP_NOT_ACTIVE';
  elsif v_ticket.status = 'USED' then
    v_result := 'ALREADY_USED';
    select * into v_prior_boarding from boarding_records
      where ticket_id = v_ticket.id and kind = 'BOARDING' limit 1;
    v_details := jsonb_build_object(
      'previous_boarded_at', v_prior_boarding.boarded_at,
      'previous_operator_id', v_prior_boarding.operator_id
    );
  else
    v_result := 'AUTHORIZED';
  end if;

  insert into validation_logs(
    operator_id, received_code, ticket_id, passenger_id, trip_id, route_id, bus_id,
    assigned_trip_id, result, latitude, longitude, details
  ) values (
    auth.uid(), p_code, v_ticket.id, v_ticket.passenger_id, v_trip.id, v_trip.route_id, v_trip.bus_id,
    v_trip_id, v_result, p_lat, p_lon, v_details
  ) returning id into v_log_id;

  return jsonb_build_object(
    'result', v_result,
    'validation_log_id', v_log_id,
    'ticket_number', v_ticket.ticket_number,
    'passenger_name', v_passenger.full_name,
    'details', v_details
  );
end;
$$;

create or replace function confirm_boarding(p_validation_log_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log validation_logs%rowtype;
  v_updated tickets%rowtype;
  v_existing boarding_records%rowtype;
  v_passenger passengers%rowtype;
begin
  select * into v_log from validation_logs where id = p_validation_log_id;

  if v_log.id is null or v_log.operator_id <> auth.uid() then
    return jsonb_build_object('result', 'SYSTEM_ERROR', 'message', 'Registro no encontrado.');
  end if;

  select * into v_existing from boarding_records where validation_log_id = p_validation_log_id;
  if v_existing.id is not null then
    return jsonb_build_object('result', 'AUTHORIZED', 'already_confirmed', true, 'boarding_id', v_existing.id);
  end if;

  if v_log.result <> 'AUTHORIZED' then
    return jsonb_build_object('result', 'SYSTEM_ERROR', 'message', 'Este intento no estaba autorizado.');
  end if;

  if now() - v_log.scanned_at > interval '60 seconds' then
    return jsonb_build_object('result', 'SYSTEM_ERROR', 'message', 'La confirmacion expiro, vuelve a escanear.');
  end if;

  update tickets set status = 'USED', used_at = now()
    where id = v_log.ticket_id and status = 'AVAILABLE'
    returning * into v_updated;

  if v_updated.id is null then
    return jsonb_build_object('result', 'ALREADY_USED', 'message', 'Otro dispositivo ya confirmo este boleto.');
  end if;

  insert into boarding_records(
    ticket_id, passenger_id, trip_id, route_id, bus_id, operator_id, kind, validation_log_id, latitude, longitude
  ) values (
    v_log.ticket_id, v_log.passenger_id, v_log.trip_id, v_log.route_id, v_log.bus_id,
    auth.uid(), 'BOARDING', p_validation_log_id, v_log.latitude, v_log.longitude
  );

  update validation_logs set confirmed_at = now() where id = p_validation_log_id;

  select * into v_passenger from passengers where id = v_log.passenger_id;

  return jsonb_build_object(
    'result', 'AUTHORIZED',
    'already_confirmed', false,
    'passenger_name', v_passenger.full_name
  );
end;
$$;

create or replace function register_reentry(p_validation_log_id uuid, p_lat double precision default null, p_lon double precision default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log validation_logs%rowtype;
begin
  select * into v_log from validation_logs where id = p_validation_log_id;

  if v_log.id is null or v_log.operator_id <> auth.uid() then
    return jsonb_build_object('result', 'SYSTEM_ERROR', 'message', 'Registro no encontrado.');
  end if;

  if v_log.result <> 'ALREADY_USED' then
    return jsonb_build_object('result', 'SYSTEM_ERROR', 'message', 'Este boleto no estaba en estado ya usado.');
  end if;

  insert into boarding_records(
    ticket_id, passenger_id, trip_id, route_id, bus_id, operator_id, kind, validation_log_id, latitude, longitude
  ) values (
    v_log.ticket_id, v_log.passenger_id, v_log.trip_id, v_log.route_id, v_log.bus_id,
    auth.uid(), 'REENTRY', p_validation_log_id, coalesce(p_lat, v_log.latitude), coalesce(p_lon, v_log.longitude)
  );

  return jsonb_build_object('result', 'OK');
end;
$$;

revoke all on function validate_ticket(text, double precision, double precision) from public;
revoke all on function confirm_boarding(uuid) from public;
revoke all on function register_reentry(uuid, double precision, double precision) from public;
grant execute on function validate_ticket(text, double precision, double precision) to authenticated;
grant execute on function confirm_boarding(uuid) to authenticated;
grant execute on function register_reentry(uuid, double precision, double precision) to authenticated;

-- =====================================================================
-- FIN DEL SCRIPT. Ahora ve al paso 2 (crear tu usuario administrador).
-- =====================================================================

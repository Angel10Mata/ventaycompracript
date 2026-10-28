-- =====================================================================
--  CryptoSim · Simulador de compra y venta de criptomonedas
--  Esquema para Supabase (PostgreSQL 15+)
--  Ejecutar completo en: Supabase > SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.a PERFILES, CREDENCIALES Y SEGURIDAD (Script 01 del equipo, incluido completo)
--     Se omiten las políticas "Permitir todo a usuarios autenticados"
--     (using true): anulan las demás políticas y dejarían a cualquier usuario
--     cambiar su rol o leer todos los perfiles.
-- ---------------------------------------------------------------------

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  require_device_authorization boolean,
  enable_passkeys boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  farmacia_nombre text,
  farmacia_direccion text,
  farmacia_telefono text,
  dias_credito int4 not null
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid not null primary key references auth.users on delete cascade,
  nombre text,
  dpi text,
  genero text,
  fecha_nacimiento date,
  direccion text,
  telefono text,
  nit text,
  contacto_emergencia text,
  rol text,
  avatar_url text,
  activo boolean default true,
  created_at timestamptz default now(),
  email text,
  telefono_emergencia text,
  puesto_id uuid
);

create table if not exists public.authorized_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  device_name text,
  browser_fingerprint text,
  is_authorized boolean,
  created_at timestamptz not null default now(),
  friendly_name text
);

create table if not exists public.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  credential_id text not null unique,
  public_key text not null,
  webauthn_user_id text not null,
  counter int8 not null,
  device_type text not null,
  backed_up boolean not null,
  transports text,
  created_at timestamptz default now(),
  device_name text
);

create or replace function public.is_admin_or_super ()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid () and p.rol in ('admin', 'super'));
$$;

alter table public.app_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.authorized_devices enable row level security;
alter table public.passkeys enable row level security;

drop policy if exists seg_app_settings_write on public.app_settings;
create policy seg_app_settings_write on public.app_settings for all to authenticated using (is_admin_or_super ()) with check (is_admin_or_super ());
drop policy if exists seg_app_settings_select on public.app_settings;
create policy seg_app_settings_select on public.app_settings for select to authenticated using (auth.uid () is not null);

drop policy if exists seg_push_subscriptions_select on public.push_subscriptions;
create policy seg_push_subscriptions_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid () or is_admin_or_super ());
drop policy if exists seg_push_subscriptions_insert on public.push_subscriptions;
create policy seg_push_subscriptions_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid ());
drop policy if exists seg_push_subscriptions_update on public.push_subscriptions;
create policy seg_push_subscriptions_update on public.push_subscriptions for update to authenticated using (user_id = auth.uid () or is_admin_or_super ()) with check (user_id = auth.uid () or is_admin_or_super ());
drop policy if exists seg_push_subscriptions_delete on public.push_subscriptions;
create policy seg_push_subscriptions_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid () or is_admin_or_super ());

drop policy if exists seg_profiles_select on public.profiles;
create policy seg_profiles_select on public.profiles for select to authenticated using (id = auth.uid () or is_admin_or_super ());
drop policy if exists seg_profiles_update on public.profiles;
create policy seg_profiles_update on public.profiles for update to authenticated using (id = auth.uid () or is_admin_or_super ()) with check (id = auth.uid () or is_admin_or_super ());
drop policy if exists seg_profiles_insert on public.profiles;
create policy seg_profiles_insert on public.profiles for insert to authenticated with check (is_admin_or_super ());
drop policy if exists seg_profiles_delete on public.profiles;
create policy seg_profiles_delete on public.profiles for delete to authenticated using (is_admin_or_super ());

drop policy if exists seg_authorized_devices_select on public.authorized_devices;
create policy seg_authorized_devices_select on public.authorized_devices for select to authenticated using (user_id = auth.uid () or is_admin_or_super ());
drop policy if exists seg_authorized_devices_insert on public.authorized_devices;
create policy seg_authorized_devices_insert on public.authorized_devices for insert to authenticated with check (user_id = auth.uid () or is_admin_or_super ());
drop policy if exists seg_authorized_devices_update on public.authorized_devices;
create policy seg_authorized_devices_update on public.authorized_devices for update to authenticated using (is_admin_or_super ()) with check (is_admin_or_super ());
drop policy if exists seg_authorized_devices_delete on public.authorized_devices;
create policy seg_authorized_devices_delete on public.authorized_devices for delete to authenticated using (user_id = auth.uid () or is_admin_or_super ());

-- passkeys: cada usuario gestiona las suyas (el script original solo traía la política abierta)
drop policy if exists seg_passkeys_own on public.passkeys;
create policy seg_passkeys_own on public.passkeys for all to authenticated
  using (user_id = auth.uid() or is_admin_or_super()) with check (user_id = auth.uid() or is_admin_or_super());

-- Un usuario puede editar sus datos personales, pero nunca su rol ni su estado
create or replace function public.proteger_rol_profiles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.rol is distinct from old.rol or new.activo is distinct from old.activo)
     and auth.uid() is not null and not public.is_admin_or_super() then
    raise exception 'No puedes cambiar tu rol ni tu estado';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_proteger_rol_profiles on public.profiles;
create trigger trg_proteger_rol_profiles before update on public.profiles
  for each row execute function public.proteger_rol_profiles();

-- ---------------------------------------------------------------------
-- 1.b TABLAS DE CRYPTOSIM
-- ---------------------------------------------------------------------

-- Saldo y estado de cuenta de cada usuario (1:1 con profiles)
create table if not exists public.billeteras (
  usuario_id uuid primary key references public.profiles(id) on delete cascade,
  saldo      numeric(18,2) not null default 10000.00 check (saldo >= 0),
  estado     text not null default 'activo' check (estado in ('activo','suspendido','baja')),
  creado_en  timestamptz not null default now()
);

-- Catálogo de criptomonedas con valor simulado
create table if not exists public.criptomonedas (
  id            smallint generated always as identity primary key,
  nombre        text not null unique,
  simbolo       text not null unique,
  precio_actual numeric(18,8) not null check (precio_actual > 0),
  precio_base   numeric(18,8) not null check (precio_base > 0),
  volatilidad   numeric(6,4) not null default 0.0150 check (volatilidad between 0 and 0.2),
  activa        boolean not null default true,
  actualizado_en timestamptz not null default now()
);

-- Tenencias actuales de cada usuario (evita recalcular desde el historial)
create table if not exists public.portafolio (
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  cripto_id  smallint not null references public.criptomonedas(id),
  cantidad   numeric(28,8) not null default 0 check (cantidad >= 0),
  primary key (usuario_id, cripto_id)
);

-- Libro de transacciones (compras y ventas)
create table if not exists public.transacciones (
  id              bigint generated always as identity primary key,
  usuario_id      uuid not null references public.profiles(id) on delete cascade,
  cripto_id       smallint not null references public.criptomonedas(id),
  tipo            text not null check (tipo in ('compra','venta')),
  cantidad        numeric(28,8) not null check (cantidad > 0),
  precio_unitario numeric(18,8) not null check (precio_unitario > 0),
  total           numeric(18,2) not null check (total > 0),
  saldo_posterior numeric(18,2) not null,
  creado_en       timestamptz not null default now()
);
create index if not exists idx_trans_usuario_fecha on public.transacciones(usuario_id, creado_en desc);
create index if not exists idx_trans_cripto        on public.transacciones(cripto_id);

-- Serie histórica de precios (para las gráficas)
create table if not exists public.historial_precios (
  id            bigint generated always as identity primary key,
  cripto_id     smallint not null references public.criptomonedas(id) on delete cascade,
  precio        numeric(18,8) not null,
  registrado_en timestamptz not null default now()
);
create index if not exists idx_hist_cripto_fecha on public.historial_precios(cripto_id, registrado_en desc);

-- Auditoría de acciones relevantes
create table if not exists public.auditoria (
  id         bigint generated always as identity primary key,
  usuario_id uuid references public.profiles(id) on delete set null,
  accion     text not null,
  detalle    jsonb not null default '{}'::jsonb,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_audit_fecha on public.auditoria(creado_en desc);

-- ---------------------------------------------------------------------
-- 2. FUNCIONES AUXILIARES
-- ---------------------------------------------------------------------

create or replace function public.es_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
      join public.billeteras b on b.usuario_id = p.id
     where p.id = auth.uid() and p.rol in ('admin','super') and b.estado = 'activo'
  );
$$;

-- Al registrarse en Supabase Auth se crea el perfil con saldo ficticio inicial
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email, rol, activo)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    new.email, 'usuario', true
  )
  on conflict (id) do nothing;
  insert into public.billeteras (usuario_id) values (new.id) on conflict do nothing;
  insert into public.auditoria (usuario_id, accion, detalle)
  values (new.id, 'registro', jsonb_build_object('correo', new.email));
  return new;
end;
$$;

drop trigger if exists trg_crear_perfil on auth.users;
create trigger trg_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Registro de inicios de sesión (auditoría de sesiones)
create or replace function public.registrar_login()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.auditoria (usuario_id, accion) values (auth.uid(), 'login');
end;
$$;

-- ---------------------------------------------------------------------
-- 3. OPERACIONES DE TRADING (transaccionales y atómicas)
-- ---------------------------------------------------------------------

create or replace function public.comprar_cripto(p_cripto_id smallint, p_cantidad numeric)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_perfil  public.billeteras%rowtype;
  v_cripto  public.criptomonedas%rowtype;
  v_total   numeric(18,2);
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if p_cantidad is null or p_cantidad <= 0 then raise exception 'La cantidad debe ser mayor a cero'; end if;
  if scale(p_cantidad) > 8 then raise exception 'Máximo 8 decimales'; end if;

  select * into v_perfil from public.billeteras where usuario_id = v_uid for update;
  if not found or v_perfil.estado <> 'activo' then
    raise exception 'La cuenta no está activa';
  end if;

  select * into v_cripto from public.criptomonedas where id = p_cripto_id and activa;
  if not found then raise exception 'Criptomoneda no disponible'; end if;

  v_total := round(p_cantidad * v_cripto.precio_actual, 2);
  if v_total <= 0 then raise exception 'El monto de la operación es demasiado pequeño'; end if;
  if v_total > v_perfil.saldo then raise exception 'Saldo insuficiente'; end if;

  update public.billeteras set saldo = saldo - v_total where usuario_id = v_uid;

  insert into public.portafolio (usuario_id, cripto_id, cantidad)
  values (v_uid, p_cripto_id, p_cantidad)
  on conflict (usuario_id, cripto_id)
  do update set cantidad = public.portafolio.cantidad + excluded.cantidad;

  insert into public.transacciones (usuario_id, cripto_id, tipo, cantidad, precio_unitario, total, saldo_posterior)
  values (v_uid, p_cripto_id, 'compra', p_cantidad, v_cripto.precio_actual, v_total, v_perfil.saldo - v_total);

  insert into public.auditoria (usuario_id, accion, detalle)
  values (v_uid, 'compra', jsonb_build_object('simbolo', v_cripto.simbolo, 'cantidad', p_cantidad, 'total', v_total));

  return jsonb_build_object('ok', true, 'total', v_total, 'saldo', v_perfil.saldo - v_total);
end;
$$;

create or replace function public.vender_cripto(p_cripto_id smallint, p_cantidad numeric)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_perfil  public.billeteras%rowtype;
  v_cripto  public.criptomonedas%rowtype;
  v_tenencia numeric(28,8);
  v_total   numeric(18,2);
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if p_cantidad is null or p_cantidad <= 0 then raise exception 'La cantidad debe ser mayor a cero'; end if;
  if scale(p_cantidad) > 8 then raise exception 'Máximo 8 decimales'; end if;

  select * into v_perfil from public.billeteras where usuario_id = v_uid for update;
  if not found or v_perfil.estado <> 'activo' then
    raise exception 'La cuenta no está activa';
  end if;

  select * into v_cripto from public.criptomonedas where id = p_cripto_id and activa;
  if not found then raise exception 'Criptomoneda no disponible'; end if;

  select cantidad into v_tenencia from public.portafolio
   where usuario_id = v_uid and cripto_id = p_cripto_id for update;
  if v_tenencia is null or v_tenencia < p_cantidad then
    raise exception 'No tienes suficiente cantidad para vender';
  end if;

  v_total := round(p_cantidad * v_cripto.precio_actual, 2);
  if v_total <= 0 then raise exception 'El monto de la operación es demasiado pequeño'; end if;

  update public.billeteras set saldo = saldo + v_total where usuario_id = v_uid;
  update public.portafolio set cantidad = cantidad - p_cantidad
   where usuario_id = v_uid and cripto_id = p_cripto_id;

  insert into public.transacciones (usuario_id, cripto_id, tipo, cantidad, precio_unitario, total, saldo_posterior)
  values (v_uid, p_cripto_id, 'venta', p_cantidad, v_cripto.precio_actual, v_total, v_perfil.saldo + v_total);

  insert into public.auditoria (usuario_id, accion, detalle)
  values (v_uid, 'venta', jsonb_build_object('simbolo', v_cripto.simbolo, 'cantidad', p_cantidad, 'total', v_total));

  return jsonb_build_object('ok', true, 'total', v_total, 'saldo', v_perfil.saldo + v_total);
end;
$$;

-- ---------------------------------------------------------------------
-- 4. SIMULACIÓN DE PRECIOS (caminata aleatoria, mínimo 5 s entre ticks)
-- ---------------------------------------------------------------------

create or replace function public.simular_precios()
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_ultimo timestamptz;
  c        record;
  v_nuevo  numeric(18,8);
  v_var    numeric;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  -- Bloqueo consultivo: solo un tick a la vez
  if not pg_try_advisory_xact_lock(hashtext('simular_precios')) then return false; end if;

  select max(actualizado_en) into v_ultimo from public.criptomonedas;
  if v_ultimo is not null and v_ultimo > now() - interval '5 seconds' then
    return false;
  end if;

  for c in select * from public.criptomonedas where activa loop
    -- variación uniforme en [-vol, +vol] con ligera reversión hacia el precio base
    v_var := (random() * 2 - 1) * c.volatilidad
             + ((c.precio_base - c.precio_actual) / c.precio_base) * 0.02;
    v_nuevo := greatest(round(c.precio_actual * (1 + v_var), 8), c.precio_base * 0.2);
    v_nuevo := least(v_nuevo, c.precio_base * 5);

    update public.criptomonedas
       set precio_actual = v_nuevo, actualizado_en = now()
     where id = c.id;

    insert into public.historial_precios (cripto_id, precio) values (c.id, v_nuevo);
  end loop;

  -- Conservar solo las últimas 2 000 muestras por moneda
  delete from public.historial_precios h
   using (
     select id from (
       select id, row_number() over (partition by cripto_id order by registrado_en desc) rn
       from public.historial_precios
     ) t where t.rn > 2000
   ) viejos
   where h.id = viejos.id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. ADMINISTRACIÓN
-- ---------------------------------------------------------------------

create or replace function public.admin_cambiar_estado(p_usuario uuid, p_estado text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Acceso denegado'; end if;
  if p_estado not in ('activo','suspendido','baja') then raise exception 'Estado inválido'; end if;
  if p_usuario = auth.uid() then raise exception 'No puedes cambiar el estado de tu propia cuenta'; end if;

  update public.billeteras set estado = p_estado where usuario_id = p_usuario;
  if not found then raise exception 'Usuario no encontrado'; end if;
  update public.profiles set activo = (p_estado = 'activo') where id = p_usuario;

  insert into public.auditoria (usuario_id, accion, detalle)
  values (auth.uid(), 'cambio_estado', jsonb_build_object('usuario', p_usuario, 'estado', p_estado));
end;
$$;

-- ---------------------------------------------------------------------
-- 6. REPORTES
-- ---------------------------------------------------------------------

-- Ranking de criptomonedas: cuántas veces y cuánto volumen se compró / vendió
create or replace function public.reporte_monedas()
returns table (
  simbolo text, nombre text,
  compras bigint, ventas bigint,
  volumen_compra numeric, volumen_venta numeric
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Acceso denegado'; end if;
  return query
  select c.simbolo, c.nombre,
         count(*) filter (where t.tipo = 'compra'),
         count(*) filter (where t.tipo = 'venta'),
         coalesce(sum(t.total) filter (where t.tipo = 'compra'), 0),
         coalesce(sum(t.total) filter (where t.tipo = 'venta'), 0)
    from public.criptomonedas c
    left join public.transacciones t on t.cripto_id = c.id
   group by c.id, c.simbolo, c.nombre
   order by 3 desc;
end;
$$;

-- Usuarios con más transacciones
create or replace function public.reporte_usuarios_top(p_limite int default 10)
returns table (
  usuario_id uuid, nombre text, correo text, estado text,
  transacciones bigint, volumen numeric
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Acceso denegado'; end if;
  return query
  select p.id, p.nombre, p.email, b.estado,
         count(t.id), coalesce(sum(t.total), 0)
    from public.profiles p
    join public.billeteras b on b.usuario_id = p.id
    left join public.transacciones t on t.usuario_id = p.id
   where coalesce(p.rol, 'usuario') = 'usuario'
   group by p.id, b.estado
   order by 5 desc, 6 desc
   limit greatest(p_limite, 1);
end;
$$;

-- Balance general de la plataforma (solo admin)
create or replace function public.balance_general()
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_usuarios int; v_activos int; v_saldo numeric; v_portafolio numeric; v_trans bigint; v_vol numeric;
begin
  if not public.es_admin() then raise exception 'Acceso denegado'; end if;

  select count(*), count(*) filter (where b.estado = 'activo'), coalesce(sum(b.saldo), 0)
    into v_usuarios, v_activos, v_saldo
    from public.profiles p join public.billeteras b on b.usuario_id = p.id
   where coalesce(p.rol, 'usuario') = 'usuario';

  select coalesce(sum(po.cantidad * c.precio_actual), 0) into v_portafolio
    from public.portafolio po join public.criptomonedas c on c.id = po.cripto_id;

  select count(*), coalesce(sum(total), 0) into v_trans, v_vol from public.transacciones;

  return jsonb_build_object(
    'usuarios', v_usuarios, 'usuarios_activos', v_activos,
    'saldo_total', round(v_saldo, 2),
    'valor_portafolios', round(v_portafolio, 2),
    'patrimonio_total', round(v_saldo + v_portafolio, 2),
    'transacciones', v_trans, 'volumen_total', round(v_vol, 2)
  );
end;
$$;

-- Actividad diaria (últimos N días) para gráfica de línea (solo admin)
create or replace function public.reporte_actividad_diaria(p_dias int default 14)
returns table (dia date, compras bigint, ventas bigint)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'Acceso denegado'; end if;
  return query
  select d::date,
         count(t.id) filter (where t.tipo = 'compra'),
         count(t.id) filter (where t.tipo = 'venta')
    from generate_series(current_date - (greatest(p_dias,1) - 1), current_date, interval '1 day') d
    left join public.transacciones t on t.creado_en::date = d::date
   group by d order by d;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. SEGURIDAD A NIVEL DE FILA (RLS)
-- ---------------------------------------------------------------------

alter table public.billeteras        enable row level security;
alter table public.criptomonedas     enable row level security;
alter table public.portafolio        enable row level security;
alter table public.transacciones     enable row level security;
alter table public.historial_precios enable row level security;
alter table public.auditoria         enable row level security;

-- billeteras: cada quien ve la suya; el admin ve todas. Nadie escribe directo.
drop policy if exists billeteras_select on public.billeteras;
create policy billeteras_select on public.billeteras for select to authenticated
  using (usuario_id = auth.uid() or public.es_admin());

-- criptomonedas e historial: lectura para cualquier usuario autenticado
drop policy if exists cripto_select on public.criptomonedas;
create policy cripto_select on public.criptomonedas for select to authenticated using (true);

drop policy if exists hist_select on public.historial_precios;
create policy hist_select on public.historial_precios for select to authenticated using (true);

-- portafolio y transacciones: dueño o admin
drop policy if exists portafolio_select on public.portafolio;
create policy portafolio_select on public.portafolio for select to authenticated
  using (usuario_id = auth.uid() or public.es_admin());

drop policy if exists trans_select on public.transacciones;
create policy trans_select on public.transacciones for select to authenticated
  using (usuario_id = auth.uid() or public.es_admin());

-- auditoría: solo admin
drop policy if exists audit_select on public.auditoria;
create policy audit_select on public.auditoria for select to authenticated
  using (public.es_admin());

-- Se revoca toda escritura directa: solo las funciones SECURITY DEFINER escriben
revoke insert, update, delete on public.billeteras, public.criptomonedas, public.portafolio,
  public.transacciones, public.historial_precios, public.auditoria from anon, authenticated;
revoke all on all tables in schema public from anon;
-- Lectura explícita (RLS decide qué filas ve cada quien)
grant select on all tables in schema public to authenticated;

-- Permisos de ejecución de funciones
revoke execute on all functions in schema public from public, anon;
grant execute on function public.es_admin()                         to authenticated;
grant execute on function public.is_admin_or_super()                to authenticated;
grant execute on function public.registrar_login()                  to authenticated;
grant execute on function public.comprar_cripto(smallint, numeric)  to authenticated;
grant execute on function public.vender_cripto(smallint, numeric)   to authenticated;
grant execute on function public.simular_precios()                  to authenticated;
grant execute on function public.admin_cambiar_estado(uuid, text)   to authenticated;
grant execute on function public.reporte_monedas()                  to authenticated;
grant execute on function public.reporte_usuarios_top(int)          to authenticated;
grant execute on function public.balance_general()                  to authenticated;
grant execute on function public.reporte_actividad_diaria(int)      to authenticated;

-- ---------------------------------------------------------------------
-- 8. DATOS INICIALES
-- ---------------------------------------------------------------------

insert into public.criptomonedas (nombre, simbolo, precio_actual, precio_base, volatilidad) values
  ('Bitcoin',  'BTC', 65000.00000000, 65000.00000000, 0.0040),
  ('Ethereum', 'ETH',  3200.00000000,  3200.00000000, 0.0060),
  ('Dogecoin', 'DOGE',    0.15000000,     0.15000000, 0.0120),
  ('Solana',   'SOL',   150.00000000,   150.00000000, 0.0090)
on conflict (simbolo) do nothing;

-- Billetera para los usuarios que ya existían en profiles (incluido tu super admin)
insert into public.billeteras (usuario_id)
select id from public.profiles
on conflict do nothing;

insert into public.historial_precios (cripto_id, precio)
select id, precio_actual from public.criptomonedas
where not exists (select 1 from public.historial_precios);

-- ---------------------------------------------------------------------
-- 8.b Si ejecutaste antes el Script 01 original en este mismo proyecto, elimina
--     sus políticas abiertas (using true), que anulan el resto:
--
--     drop policy if exists "Permitir todo a usuarios autenticados en profiles" on public.profiles;
--     drop policy if exists "Permitir todo a usuarios autenticados en app_settings" on public.app_settings;
--     drop policy if exists "Permitir todo a usuarios autenticados en push_subscriptions" on public.push_subscriptions;
--     drop policy if exists "Permitir todo a usuarios autenticados en authorized_devices" on public.authorized_devices;
--     drop policy if exists "Permitir todo a usuarios autenticados en passkeys" on public.passkeys;
--
-- 9. CREAR EL PRIMER ADMINISTRADOR
--    1) Regístrate normalmente desde la app.
--    2) Ejecuta (cambiando el correo):
--
--    update public.profiles set rol = 'super' where email = 'tu-correo@ejemplo.com';
--    (los roles 'admin' y 'super' tienen acceso al panel de administración)
-- ---------------------------------------------------------------------

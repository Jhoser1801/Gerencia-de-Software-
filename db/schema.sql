-- Base de datos de Lattely en Supabase (SCRUM-55, 56 y 57).
-- Para usarlo: en Supabase abrir SQL Editor, pegar todo el archivo y darle Run.
-- Ojo: si se vuelve a correr, borra todo y lo crea de nuevo, también los pedidos.
-- Desde la página solo se pueden usar las funciones de abajo, no las tablas directamente.
-- Pagos: el cliente solo registra pagos "Pendiente" (al recoger o por transferencia) y la cafetería,
-- con su PIN (tabla ajustes), los aprueba o rechaza.

drop function if exists public.resolver_pago(text, boolean, text);
drop function if exists public.pagos_pendientes(text);
drop function if exists public.pin_valido(text);
drop function if exists public.registrar_pago(text, text, text, text);
drop function if exists public.registrar_pago(text, text, text);
drop function if exists public.consultar_pedido(text);
drop function if exists public.confirmar_pedido(jsonb, uuid);
drop table if exists public.ajustes cascade;
drop table if exists public.pagos cascade;
drop table if exists public.items_pedido cascade;
drop table if exists public.pedidos cascade;
drop table if exists public.leches cascade;
drop table if exists public.productos cascade;


create table public.productos (
  id      integer primary key,
  nombre  text    not null,
  precio  integer not null check (precio > 0),
  activo  boolean not null default true
);

create table public.leches (
  nombre  text    primary key,
  recargo integer not null default 0 check (recargo >= 0)
);

create table public.pedidos (
  id                 uuid        primary key default gen_random_uuid(),
  codigo             text        not null unique,
  clave_idempotencia uuid        not null unique,
  estado             text        not null default 'Confirmado'
                                 check (estado in ('Confirmado', 'Pagado')),
  subtotal           integer     not null check (subtotal >= 0),
  recargos           integer     not null check (recargos >= 0),
  total              integer     not null check (total > 0),
  creado_en          timestamptz not null default now(),
  check (total = subtotal + recargos)
);

create table public.items_pedido (
  id              bigint  generated always as identity primary key,
  pedido_id       uuid    not null references public.pedidos(id) on delete cascade,
  producto_id     integer not null references public.productos(id),
  nombre          text    not null,
  tamano          text    not null check (tamano in ('Pequeño', 'Mediano', 'Grande')),
  leche           text    not null references public.leches(nombre),
  cantidad        integer not null check (cantidad between 1 and 20),
  precio_base     integer not null check (precio_base > 0),
  recargo_leche   integer not null check (recargo_leche >= 0),
  precio_unitario integer not null check (precio_unitario = precio_base + recargo_leche),
  subtotal        integer not null check (subtotal = precio_unitario * cantidad)
);

create table public.pagos (
  id          bigint      generated always as identity primary key,
  pedido_id   uuid        not null references public.pedidos(id) on delete cascade,
  monto       integer     not null check (monto > 0),
  estado      text        not null check (estado in ('Aprobado', 'Rechazado', 'Pendiente')),
  referencia  text        not null unique,
  metodo      text        not null check (metodo in ('Pagar al recoger', 'Transferencia')),
  creado_en   timestamptz not null default now(),
  revisado_en timestamptz
);

-- PIN de la vista "Cafetería". Cambiarlo antes de publicar:
-- update ajustes set valor = 'nuevo PIN' where clave = 'pin_cafeteria';
create table public.ajustes (
  clave text primary key,
  valor text not null
);

create index on public.items_pedido (pedido_id);
create index on public.pagos (pedido_id);
-- un pedido tiene como máximo un pago pendiente a la vez
create unique index pagos_un_pendiente on public.pagos (pedido_id) where estado = 'Pendiente';

-- nadie puede leer ni cambiar las tablas directamente desde la página (SCRUM-56)

alter table public.productos    enable row level security;
alter table public.leches       enable row level security;
alter table public.pedidos      enable row level security;
alter table public.items_pedido enable row level security;
alter table public.pagos        enable row level security;
alter table public.ajustes      enable row level security;

revoke all on public.productos, public.leches, public.pedidos, public.items_pedido, public.pagos, public.ajustes
  from anon, authenticated;

-- Guardar el pedido (SCRUM-42 y SCRUM-43). Los precios se calculan aquí y no se confía en los de la página.
-- Si la misma clave llega dos veces (doble clic), se devuelve el mismo pedido.

create or replace function public.confirmar_pedido(p_items jsonb, p_clave uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido   pedidos%rowtype;
  v_item     jsonb;
  v_prod     productos%rowtype;
  v_recargo  integer;
  v_cant     integer;
  v_tamano   text;
  v_leche    text;
  v_subtotal integer := 0;
  v_recargos integer := 0;
  v_codigo   text;
begin
  if p_clave is null then
    raise exception 'Falta la clave del pedido.';
  end if;

  select * into v_pedido from pedidos where clave_idempotencia = p_clave;
  if found then
    return consultar_pedido(v_pedido.codigo);
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'El pedido tiene demasiados productos.';
  end if;

  -- primero revisamos todo y después sí guardamos
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_tamano := v_item->>'tamano';
    v_leche  := coalesce(v_item->>'leche', 'Entera');
    v_cant   := (v_item->>'cantidad')::integer;

    select * into v_prod from productos where id = (v_item->>'producto_id')::integer and activo;
    if not found then
      raise exception 'Hay un producto que no existe o no está disponible.';
    end if;
    if v_tamano is null or v_tamano not in ('Pequeño', 'Mediano', 'Grande') then
      raise exception 'Falta elegir el tamaño de %.', v_prod.nombre;
    end if;
    select recargo into v_recargo from leches where nombre = v_leche;
    if not found then
      raise exception 'Tipo de leche no válido en %.', v_prod.nombre;
    end if;
    if v_cant is null or v_cant < 1 or v_cant > 20 then
      raise exception 'Cantidad no válida en %.', v_prod.nombre;
    end if;

    v_subtotal := v_subtotal + v_prod.precio * v_cant;
    v_recargos := v_recargos + v_recargo * v_cant;
  end loop;

  loop
    v_codigo := 'LAT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from pedidos where codigo = v_codigo);
  end loop;

  insert into pedidos (codigo, clave_idempotencia, subtotal, recargos, total)
  values (v_codigo, p_clave, v_subtotal, v_recargos, v_subtotal + v_recargos)
  returning * into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_prod from productos where id = (v_item->>'producto_id')::integer;
    v_leche := coalesce(v_item->>'leche', 'Entera');
    select recargo into v_recargo from leches where nombre = v_leche;
    v_cant := (v_item->>'cantidad')::integer;

    insert into items_pedido (pedido_id, producto_id, nombre, tamano, leche, cantidad,
                              precio_base, recargo_leche, precio_unitario, subtotal)
    values (v_pedido.id, v_prod.id, v_prod.nombre, v_item->>'tamano', v_leche, v_cant,
            v_prod.precio, v_recargo, v_prod.precio + v_recargo, (v_prod.precio + v_recargo) * v_cant);
  end loop;

  return consultar_pedido(v_pedido.codigo);
exception
  when unique_violation then
    select * into v_pedido from pedidos where clave_idempotencia = p_clave;
    if found then
      return consultar_pedido(v_pedido.codigo);
    end if;
    raise;
end;
$$;

-- Buscar un pedido por su código (SCRUM-44)

create or replace function public.consultar_pedido(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'codigo',    p.codigo,
    'estado',    p.estado,
    'subtotal',  p.subtotal,
    'recargos',  p.recargos,
    'total',     p.total,
    'creado_en', p.creado_en,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'producto_id',     i.producto_id,
               'nombre',          i.nombre,
               'tamano',          i.tamano,
               'leche',           i.leche,
               'cantidad',        i.cantidad,
               'precio_unitario', i.precio_unitario,
               'recargo_leche',   i.recargo_leche,
               'subtotal',        i.subtotal) order by i.id)
      from items_pedido i where i.pedido_id = p.id), '[]'::jsonb),
    'pagos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'estado',     g.estado,
               'monto',      g.monto,
               'referencia', g.referencia,
               'metodo',     g.metodo,
               'creado_en',  g.creado_en) order by g.id)
      from pagos g where g.pedido_id = p.id), '[]'::jsonb)
  )
  from pedidos p
  where p.codigo = upper(trim(p_codigo));
$$;

-- Guardar el pago que inicia el cliente (SCRUM-45 y 46). Siempre queda "Pendiente".
-- Un pedido pagado ya no acepta más pagos y no puede tener dos pagos pendientes.

create or replace function public.registrar_pago(p_codigo text, p_referencia text, p_metodo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos%rowtype;
begin
  select * into v_pedido from pedidos where codigo = upper(trim(p_codigo)) for update;
  if not found then
    raise exception 'No encontramos ese pedido.';
  end if;
  if v_pedido.estado = 'Pagado' then
    raise exception 'Este pedido ya está pagado.';
  end if;
  if p_metodo is null or p_metodo not in ('Pagar al recoger', 'Transferencia') then
    raise exception 'Medio de pago no válido.';
  end if;
  if coalesce(trim(p_referencia), '') = '' then
    raise exception 'Falta la referencia del pago.';
  end if;
  if exists (select 1 from pagos where pedido_id = v_pedido.id and estado = 'Pendiente') then
    raise exception 'Este pedido ya tiene un pago pendiente de revisión.';
  end if;
  if exists (select 1 from pagos where referencia = trim(p_referencia)) then
    raise exception 'Esa referencia ya se registró en otro pago. Revisa el número que te dio tu banco.';
  end if;

  insert into pagos (pedido_id, monto, estado, referencia, metodo)
  values (v_pedido.id, v_pedido.total, 'Pendiente', trim(p_referencia), p_metodo);

  return consultar_pedido(v_pedido.codigo);
end;
$$;

-- Vista "Cafetería": revisar el PIN, listar los pagos pendientes y aprobarlos o rechazarlos

create or replace function public.pin_valido(p_pin text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from ajustes where clave = 'pin_cafeteria' and valor = coalesce(p_pin, ''));
$$;

create or replace function public.pagos_pendientes(p_pin text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not pin_valido(p_pin) then
    raise exception 'PIN incorrecto.';
  end if;
  return coalesce((
    select jsonb_agg(consultar_pedido(p.codigo) order by g.creado_en)
    from pedidos p join pagos g on g.pedido_id = p.id
    where g.estado = 'Pendiente' and p.estado <> 'Pagado'), '[]'::jsonb);
end;
$$;

create or replace function public.resolver_pago(p_codigo text, p_aprobar boolean, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos%rowtype;
  v_pago   pagos%rowtype;
begin
  if not pin_valido(p_pin) then
    raise exception 'PIN incorrecto.';
  end if;
  select * into v_pedido from pedidos where codigo = upper(trim(p_codigo)) for update;
  if not found then
    raise exception 'No encontramos ese pedido.';
  end if;
  select * into v_pago from pagos where pedido_id = v_pedido.id and estado = 'Pendiente' for update;
  if not found then
    raise exception 'Este pedido no tiene un pago pendiente.';
  end if;

  update pagos set estado = case when p_aprobar then 'Aprobado' else 'Rechazado' end, revisado_en = now()
  where id = v_pago.id;
  if p_aprobar then
    update pedidos set estado = 'Pagado' where id = v_pedido.id;
  end if;

  return consultar_pedido(v_pedido.codigo);
end;
$$;

revoke all on function public.confirmar_pedido(jsonb, uuid)              from public;
revoke all on function public.consultar_pedido(text)                     from public;
revoke all on function public.registrar_pago(text, text, text)           from public;
revoke all on function public.pin_valido(text)                           from public, anon, authenticated;
revoke all on function public.pagos_pendientes(text)                     from public;
revoke all on function public.resolver_pago(text, boolean, text)         from public;
grant execute on function public.confirmar_pedido(jsonb, uuid)           to anon, authenticated;
grant execute on function public.consultar_pedido(text)                  to anon, authenticated;
grant execute on function public.registrar_pago(text, text, text)        to anon, authenticated;
grant execute on function public.pagos_pendientes(text)                  to anon, authenticated;
grant execute on function public.resolver_pago(text, boolean, text)      to anon, authenticated;

-- Datos de prueba, iguales a los de datos.js

insert into public.productos (id, nombre, precio) values
  (1, 'Latte',          5200),
  (2, 'Cappuccino',     4500),
  (3, 'Americano Frío', 3800),
  (4, 'Té Chai',        4800);

insert into public.ajustes (clave, valor) values ('pin_cafeteria', '2468');

insert into public.leches (nombre, recargo) values
  ('Entera',        0),
  ('Deslactosada',  0),
  ('Almendras',  2000);

-- Dos pedidos de ejemplo: LAT-DEMO01 pagado por transferencia ($11.000) y LAT-DEMO02 con una transferencia rechazada ($9.000)
do $$
declare v_id uuid;
begin
  insert into pedidos (codigo, clave_idempotencia, subtotal, recargos, total, estado)
  values ('LAT-DEMO01', gen_random_uuid(), 9000, 2000, 11000, 'Pagado') returning id into v_id;
  insert into items_pedido (pedido_id, producto_id, nombre, tamano, leche, cantidad, precio_base, recargo_leche, precio_unitario, subtotal) values
    (v_id, 1, 'Latte',          'Mediano', 'Almendras', 1, 5200, 2000, 7200, 7200),
    (v_id, 3, 'Americano Frío', 'Pequeño', 'Entera',    1, 3800,    0, 3800, 3800);
  insert into pagos (pedido_id, monto, estado, referencia, metodo, revisado_en)
  values (v_id, 11000, 'Aprobado', 'TRF-DEMO0001', 'Transferencia', now());

  insert into pedidos (codigo, clave_idempotencia, subtotal, recargos, total)
  values ('LAT-DEMO02', gen_random_uuid(), 9000, 0, 9000) returning id into v_id;
  insert into items_pedido (pedido_id, producto_id, nombre, tamano, leche, cantidad, precio_base, recargo_leche, precio_unitario, subtotal) values
    (v_id, 2, 'Cappuccino', 'Grande', 'Entera', 2, 4500, 0, 4500, 9000);
  insert into pagos (pedido_id, monto, estado, referencia, metodo, revisado_en)
  values (v_id, 9000, 'Rechazado', 'TRF-DEMO0002', 'Transferencia', now());
end $$;

# Arquitectura y flujos – Lattely

Los diagramas describen el código que hay en este repositorio. Están en Mermaid, así que GitHub los dibuja solos.

## 1. Vista general

Lattely es una página web estática, sin servidor propio ni paso de compilación. Puede guardar los pedidos de dos formas, y las dos usan la misma interfaz `Api`:

- **Modo local** (`ApiLocal`): guarda en `localStorage` del navegador. Se usa cuando `config.js` está vacío.
- **Modo nube** (`ApiSupabase`): llama a funciones RPC de Supabase (PostgreSQL). Se usa cuando `config.js` tiene URL y clave `anon`.

```mermaid
flowchart LR
  U([Cliente]) --> UI

  subgraph Navegador
    UI["index.html + estilos.css<br/>vistas: menú, pago, consulta"]
    APP["app.js<br/>estado, eventos y pintado"]
    LOG["logica.js<br/>precios, carrito, validaciones,<br/>calcularPedido()"]
    DAT["datos.js<br/>PRODUCTOS, TAMANOS, LECHES"]
    CFG["config.js<br/>URL y clave anon"]
    API{{"api.js<br/>Api = ApiSupabase o ApiLocal"}}
    PAS["pasarela.js<br/>Pasarela.cobrar()"]
    LS[("localStorage<br/>carrito, último pedido,<br/>pedidos en modo local")]
  end

  subgraph Supabase
    RPC["Funciones RPC (security definer)<br/>confirmar_pedido<br/>consultar_pedido<br/>registrar_pago"]
    DB[("PostgreSQL con RLS<br/>productos, leches, pedidos,<br/>items_pedido, pagos")]
  end

  UI --> APP
  APP --> LOG --> DAT
  APP --> PAS
  APP --> API
  CFG --> API
  API -- modo local --> LS
  API -- modo nube: HTTPS REST --> RPC --> DB
  APP --> LS
```

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura de las tres vistas y de las ventanas (personalizar, resumen, privacidad) |
| `estilos.css` | Diseño y adaptación a celular |
| `datos.js` | Catálogo: productos, precios, tamaños, recargos de leche e imágenes |
| `logica.js` | Funciones puras sin acceso al DOM: precio unitario, carrito, totales, validación y `calcularPedido()`. Es lo que prueban las pruebas automáticas |
| `app.js` | Estado de la interfaz, acciones del usuario y navegación por `#menu`, `#pago` y `#consulta` |
| `api.js` | Persistencia de pedidos y pagos con la misma interfaz en los dos modos |
| `pasarela.js` | Pasarela de pagos. Para usar una pasarela real basta con cambiar `cobrar()` |
| `db/schema.sql` | Tablas, RLS, funciones RPC y datos de ejemplo de Supabase |

## 2. Modelo de datos (Supabase)

```mermaid
erDiagram
  productos ||--o{ items_pedido : "se pide en"
  leches ||--o{ items_pedido : "se usa en"
  pedidos ||--|{ items_pedido : contiene
  pedidos ||--o{ pagos : "tiene intentos"

  productos { int id PK
    text nombre
    int precio
    bool activo }
  leches { text nombre PK
    int recargo }
  pedidos { uuid id PK
    text codigo "LAT-XXXXXX, único"
    uuid clave_idempotencia "única, evita duplicados"
    text estado "Confirmado o Pagado"
    int subtotal
    int recargos
    int total
    timestamptz creado_en }
  items_pedido { bigint id PK
    uuid pedido_id FK
    int producto_id FK
    text nombre
    text tamano
    text leche FK
    int cantidad "1 a 20"
    int precio_base
    int recargo_leche
    int precio_unitario "base + recargo"
    int subtotal "unitario x cantidad" }
  pagos { bigint id PK
    uuid pedido_id FK
    text estado "Aprobado, Rechazado o Pendiente"
    int monto
    text referencia "única"
    text metodo
    timestamptz creado_en }
```

Seguridad: todas las tablas tienen RLS activado y se revocan los permisos directos. La clave `anon` solo puede ejecutar las tres funciones RPC. Los precios se recalculan en el servidor y la tabla `pagos` no tiene columnas para datos de tarjeta. Las columnas exactas están en `db/schema.sql`.

## 3. Flujo: armar y confirmar el pedido

```mermaid
sequenceDiagram
  actor C as Cliente
  participant A as app.js
  participant L as logica.js
  participant API as api.js
  participant S as Supabase / localStorage

  C->>A: + Agregar, tamaño, leche
  A->>L: agregarItem(carrito, producto, tamaño, leche)
  L-->>A: error si falta tamaño, o ítem agregado
  A->>A: guarda carrito en localStorage y repinta totales
  C->>A: Confirmar pedido
  A->>L: validarCarrito(carrito)
  A-->>C: resumen con subtotal, recargos y total
  C->>A: Confirmar y pagar
  A->>A: deshabilita el botón y crea la clave UUID del carrito
  A->>API: confirmarPedido(producto, tamaño, leche y cantidad; clave)
  API->>S: confirmar_pedido (recalcula precios desde las tablas)
  alt la clave ya existe (doble clic o reintento)
    S-->>API: el mismo pedido de antes
  else clave nueva
    S-->>API: pedido nuevo LAT-XXXXXX, estado Confirmado
  end
  API-->>A: pedido
  A->>A: vacía el carrito, guarda el último código y va a #pago
```

## 4. Flujo: pago

```mermaid
sequenceDiagram
  actor C as Cliente
  participant A as app.js
  participant P as pasarela.js
  participant API as api.js
  participant S as Supabase / localStorage

  C->>A: elige medio y pulsa Pagar
  A->>P: cobrar(monto = total guardado, código, medio)
  P-->>A: estado Aprobado, Rechazado o Pendiente, con referencia
  A->>API: registrarPago(código, resultado)
  API->>S: registrar_pago
  alt el pedido ya está Pagado
    S-->>A: error "Este pedido ya está pagado."
  else
    S->>S: guarda el intento en pagos (monto tomado del pedido)
    opt estado Aprobado
      S->>S: pedido.estado = Pagado
    end
    S-->>A: pedido actualizado
  end
  A-->>C: mensaje de aprobado, rechazado o pendiente
```

## 5. Flujo: consulta

```mermaid
flowchart TD
  A[Mi pedido: escribir código] --> B{¿Código vacío?}
  B -- sí --> A
  B -- no --> C[Api.consultarPedido código en mayúsculas]
  C --> D{¿Existe?}
  D -- no --> E["No encontramos ese pedido…"]
  D -- sí --> F[Mostrar ítems, totales, estado del pedido y del pago, intentos]
  F --> G{¿Pagado?}
  G -- no --> H[Botón Ir a pagar → #pago]
  G -- sí --> I[Fin]
  C -. error de red .-> J["No pudimos conectar con el servidor…"]
```

## 6. Limitaciones conocidas
- La pasarela no está conectada a un banco: el medio elegido define el resultado. Con una pasarela real, el resultado lo tendría que confirmar el servidor (webhook) y no el navegador.
- En modo local los pedidos solo existen en el navegador donde se hicieron.
- No hay cuentas de usuario: quien conozca el código de un pedido puede consultarlo.

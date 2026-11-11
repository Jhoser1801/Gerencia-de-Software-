// Aquí se guardan y se buscan los pedidos y los pagos (SCRUM-43, 44 y 46).
// Hay dos formas: con Supabase o guardando en el mismo navegador. Las dos siguen las mismas reglas:
//   - El cliente solo puede registrar pagos "Pendiente" (al recoger o por transferencia).
//   - Un pedido tiene como máximo un pago pendiente a la vez y se marca "Pagado" una sola vez.
//   - Solo la cafetería, con su PIN, aprueba o rechaza un pago pendiente.

const METODOS_PAGO = ["Pagar al recoger", "Transferencia"];

const ApiSupabase = (() => {
  async function rpc(nombre, parametros) {
    let respuesta;
    try {
      respuesta = await fetch(`${LATTELY_CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${nombre}`, {
        method: "POST",
        headers: {
          apikey: LATTELY_CONFIG.supabaseAnonKey,
          Authorization: `Bearer ${LATTELY_CONFIG.supabaseAnonKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parametros)
      });
    } catch {
      throw new Error("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    }
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      const propio = datos && datos.code === "P0001" && datos.message;
      throw new Error(propio || "El servidor no pudo procesar la solicitud. Inténtalo de nuevo.");
    }
    return datos;
  }
  return {
    modo: "supabase",
    confirmarPedido: (items, clave) => rpc("confirmar_pedido", { p_items: items, p_clave: clave }),
    consultarPedido: codigo => rpc("consultar_pedido", { p_codigo: codigo }),
    registrarPago: (codigo, r) => {
      if (r.estado !== "Pendiente") return Promise.reject(new Error("Solo la cafetería puede aprobar o rechazar un pago."));
      return rpc("registrar_pago", { p_codigo: codigo, p_referencia: r.referencia, p_metodo: r.metodo });
    },
    pagosPendientes: pin => rpc("pagos_pendientes", { p_pin: String(pin || "") }),
    resolverPago: (codigo, aprobar, pin) => rpc("resolver_pago", { p_codigo: codigo, p_aprobar: !!aprobar, p_pin: String(pin || "") })
  };
})();

// si no hay Supabase configurado, los pedidos se guardan en el navegador con las mismas reglas
const ApiLocal = (() => {
  const LLAVE = "lattely.pedidosLocales";
  function leer() {
    try { return JSON.parse(localStorage.getItem(LLAVE)) || { pedidos: {} }; }
    catch { return { pedidos: {} }; }
  }
  function escribir(db) {
    try { localStorage.setItem(LLAVE, JSON.stringify(db)); }
    catch { throw new Error("Este navegador no permite guardar datos. Usa Supabase o otro navegador."); }
  }
  const copia = p => (p ? JSON.parse(JSON.stringify(p)) : null);
  const espera = () => new Promise(r => setTimeout(r, 250));
  const normalizar = codigo => String(codigo || "").trim().toUpperCase();
  function revisarPin(pin) {
    if (!LATTELY_CONFIG.pinCafeteria || String(pin || "") !== String(LATTELY_CONFIG.pinCafeteria)) throw new Error("PIN incorrecto.");
  }

  return {
    modo: "local",
    async confirmarPedido(items, clave) {
      await espera();
      if (!clave) throw new Error("Falta la clave del pedido.");
      const db = leer();
      const existente = Object.values(db.pedidos).find(p => p.clave === clave);
      if (existente) return copia(existente);
      const calculo = calcularPedido(items);
      let codigo;
      do { codigo = "LAT-" + nuevoUUID().replace(/-/g, "").slice(0, 6).toUpperCase(); } while (db.pedidos[codigo]);
      db.pedidos[codigo] = { codigo, clave, estado: "Confirmado", creado_en: new Date().toISOString(), pagos: [], ...calculo };
      escribir(db);
      return copia(db.pedidos[codigo]);
    },
    async consultarPedido(codigo) {
      await espera();
      return copia(leer().pedidos[normalizar(codigo)]);
    },
    async registrarPago(codigo, r) {
      await espera();
      const db = leer();
      const p = db.pedidos[normalizar(codigo)];
      if (!p) throw new Error("No encontramos ese pedido.");
      if (p.estado === "Pagado") throw new Error("Este pedido ya está pagado.");
      if (r.estado !== "Pendiente") throw new Error("Solo la cafetería puede aprobar o rechazar un pago.");
      if (!METODOS_PAGO.includes(r.metodo)) throw new Error("Medio de pago no válido.");
      if (!String(r.referencia || "").trim()) throw new Error("Falta la referencia del pago.");
      const ultimo = ultimoPago(p);
      if (ultimo && ultimo.estado === "Pendiente") throw new Error("Este pedido ya tiene un pago pendiente de revisión.");
      const usada = Object.values(db.pedidos).some(x => x.pagos.some(g => g.referencia === r.referencia));
      if (usada) throw new Error("Esa referencia ya se registró en otro pago. Revisa el número que te dio tu banco.");
      p.pagos.push({ estado: "Pendiente", monto: p.total, referencia: r.referencia, metodo: r.metodo, creado_en: new Date().toISOString() });
      escribir(db);
      return copia(p);
    },
    async pagosPendientes(pin) {
      await espera();
      revisarPin(pin);
      return Object.values(leer().pedidos)
        .filter(p => p.estado !== "Pagado" && (ultimoPago(p) || {}).estado === "Pendiente")
        .sort((a, b) => ultimoPago(a).creado_en.localeCompare(ultimoPago(b).creado_en))
        .map(copia);
    },
    async resolverPago(codigo, aprobar, pin) {
      await espera();
      revisarPin(pin);
      const db = leer();
      const p = db.pedidos[normalizar(codigo)];
      if (!p) throw new Error("No encontramos ese pedido.");
      const ultimo = ultimoPago(p);
      if (!ultimo || ultimo.estado !== "Pendiente") throw new Error("Este pedido no tiene un pago pendiente.");
      ultimo.estado = aprobar ? "Aprobado" : "Rechazado";
      ultimo.revisado_en = new Date().toISOString();
      if (aprobar) p.estado = "Pagado";
      escribir(db);
      return copia(p);
    }
  };
})();

const Api = (LATTELY_CONFIG.supabaseUrl && LATTELY_CONFIG.supabaseAnonKey) ? ApiSupabase : ApiLocal;

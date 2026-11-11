// Aquí se guardan y se buscan los pedidos y los pagos (SCRUM-43, 44 y 46).
// Hay dos formas: con Supabase o guardando en el mismo navegador.

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
    registrarPago: (codigo, r) => rpc("registrar_pago", {
      p_codigo: codigo, p_estado: r.estado, p_referencia: r.referencia, p_metodo: r.metodo
    })
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
      return copia(leer().pedidos[String(codigo || "").trim().toUpperCase()]);
    },
    async registrarPago(codigo, r) {
      await espera();
      const db = leer();
      const p = db.pedidos[String(codigo || "").trim().toUpperCase()];
      if (!p) throw new Error("No encontramos ese pedido.");
      if (p.estado === "Pagado") throw new Error("Este pedido ya está pagado.");
      if (!["Aprobado", "Rechazado", "Pendiente"].includes(r.estado)) throw new Error("Estado de pago no válido.");
      p.pagos.push({ estado: r.estado, monto: p.total, referencia: r.referencia, metodo: r.metodo, creado_en: new Date().toISOString() });
      if (r.estado === "Aprobado") p.estado = "Pagado";
      escribir(db);
      return copia(p);
    }
  };
})();

const Api = (LATTELY_CONFIG.supabaseUrl && LATTELY_CONFIG.supabaseAnonKey) ? ApiSupabase : ApiLocal;

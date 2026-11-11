// Aquí está todo lo que se ve en pantalla y lo que pasa cuando la persona hace clic.

const estado = { producto: null, tamano: null, leche: "Entera" };
const LLAVE_CARRITO = "lattely.carrito";
const LLAVE_ULTIMO = "lattely.ultimoPedido";
const carrito = rehidratarCarrito(leerLocal(LLAVE_CARRITO));
let imagenActual = null;
// Esta clave evita que un pedido se guarde dos veces si le dan doble clic a confirmar (SCRUM-42)
const checkout = { clave: null, enviando: false, error: "" };
const pago = { pedido: null, cargando: false, procesando: false, mensaje: null, error: "", medio: "recoger", referencia: "" };
const $ = id => document.getElementById(id);

function leerLocal(llave) { try { return JSON.parse(localStorage.getItem(llave)); } catch { return null; } }
function guardarLocal(llave, valor) { try { localStorage.setItem(llave, JSON.stringify(valor)); } catch { } }
function carritoCambio() {
  checkout.clave = null;
  $("aviso-carrito").textContent = "";
  guardarLocal(LLAVE_CARRITO, carrito);
}

// Elegir la bebida, el tamaño y la leche
function elegirProducto(id) {
  // si cambian de bebida, empieza otra vez sin tamaño y con leche entera
  estado.producto = productosValidos(PRODUCTOS).find(p => p.id === id) || null;
  estado.tamano = null;
  estado.leche = "Entera";
  imagenActual = estado.producto ? datosImagen(estado.producto, null) : null;
  avisoModal = "";
  pintarDetalle();
  if (estado.producto && $("modal").showModal) $("modal").showModal();
}
let avisoModal = "";
function elegirTamano(t) {
  estado.tamano = t;
  if (estado.producto) imagenActual = datosImagen(estado.producto, t);
  avisoModal = "";
  actualizarDetalle();
}
function elegirLeche(l) { estado.leche = l; actualizarDetalle(); }
function agregarAlCarrito() {
  const error = agregarItem(carrito, estado.producto, estado.tamano, estado.leche);
  if (error) { avisoModal = error; actualizarDetalle(); return; }
  carritoCambio();
  cerrarModal();
}
function cerrarModal() {
  estado.producto = null; estado.tamano = null; estado.leche = "Entera"; imagenActual = null; avisoModal = "";
  if ($("modal").close && $("modal").open) $("modal").close();
  $("detalle").innerHTML = "";
  pintar();
}

// Carrito: cantidades y quitar productos (SCRUM-40 y SCRUM-14)
function cambiarCantidadItem(indice, delta) { if (cambiarCantidad(carrito, indice, delta)) { carritoCambio(); pintar(); } }
function quitarDelCarrito(indice) {
  if (quitarItem(carrito, indice)) { carritoCambio(); pintar(); }
}
function irAlCarrito() {
  if (location.hash && location.hash !== "#menu") location.hash = "#menu";
  setTimeout(() => { $("pedido").scrollIntoView({ behavior: "smooth" }); $("pedido").focus({ preventScroll: true }); }, 0);
}

// Confirmar el pedido (SCRUM-42)
function abrirResumen() {
  const error = validarCarrito(carrito);
  if (error) { $("aviso-carrito").textContent = error; return; }
  if (!checkout.clave) checkout.clave = nuevoUUID();
  checkout.error = "";
  pintarResumen();
  $("resumen").showModal();
}
function cerrarResumen() { if (!checkout.enviando && $("resumen").open) $("resumen").close(); }
async function confirmarPedido() {
  if (checkout.enviando) return;
  const error = validarCarrito(carrito);
  if (error) { checkout.error = error; pintarResumen(); return; }
  checkout.enviando = true; checkout.error = ""; pintarResumen();
  try {
    const pedido = await Api.confirmarPedido(itemsParaPedido(carrito), checkout.clave);
    carrito.length = 0;
    carritoCambio();
    guardarLocal(LLAVE_ULTIMO, pedido.codigo);
    pago.pedido = pedido; pago.mensaje = null; pago.error = "";
    checkout.enviando = false;
    $("resumen").close();
    pintar();
    location.hash = "#pago";
  } catch (e) {
    checkout.enviando = false;
    checkout.error = e.message;
    pintarResumen();
  }
}

// Pagar: al recoger o por transferencia (SCRUM-45 y SCRUM-46). El pago queda pendiente hasta que la cafetería lo revisa.
async function cargarPedidoParaPago(forzar) {
  const codigo = leerLocal(LLAVE_ULTIMO);
  if (!forzar && pago.pedido && pago.pedido.codigo === codigo) return pintarPago();
  if (!codigo) { pago.pedido = null; return pintarPago(); }
  pago.cargando = true; pintarPago();
  try { pago.pedido = await Api.consultarPedido(codigo); pago.error = ""; }
  catch (e) { pago.error = e.message; }
  pago.cargando = false; pintarPago();
}
function elegirMedio(medio) {
  pago.medio = medio;
  pago.error = "";
  document.querySelectorAll(".form-pago .medio").forEach(l => l.classList.toggle("sel", l.dataset.medio === medio));
  $("panel-transferencia").hidden = medio !== "transferencia";
  $("btn-pagar").textContent = medio === "transferencia" ? "Enviar referencia" : "Confirmar pago al recoger";
  $("error-pago").textContent = "";
}
async function pagar(evento) {
  evento.preventDefault();
  if (pago.procesando || !pago.pedido) return;
  const datos = new FormData(evento.target);
  pago.medio = datos.get("medio");
  pago.referencia = String(datos.get("referencia") || "");
  let solicitud;
  try {
    // el monto es el total que quedó guardado en el pedido
    solicitud = Pasarela.iniciarPago({ monto: pago.pedido.total, referenciaPedido: pago.pedido.codigo,
                                        medio: pago.medio, referenciaTransferencia: pago.referencia });
  } catch (e) {
    $("error-pago").textContent = e.message;
    if (pago.medio === "transferencia") $("referencia").focus();
    return;
  }
  pago.procesando = true; pago.error = ""; pintarPago();
  try {
    pago.pedido = await Api.registrarPago(pago.pedido.codigo, solicitud);
    pago.referencia = "";
  } catch (e) {
    pago.error = e.message;
    try { pago.pedido = await Api.consultarPedido(pago.pedido.codigo) || pago.pedido; } catch { }
  }
  pago.procesando = false; pintarPago();
}

// Vista "Cafetería": la cafetería aprueba o rechaza los pagos pendientes con su PIN
const caf = { pin: null, pedidos: [], cargando: false, error: "", mensaje: "" };
async function entrarCafeteria(evento) {
  evento.preventDefault();
  const pin = $("pin").value.trim();
  if (!pin) { caf.error = "Escribe el PIN de la cafetería."; return pintarCafeteria(); }
  caf.cargando = true; caf.error = ""; pintarCafeteria();
  try { caf.pedidos = await Api.pagosPendientes(pin); caf.pin = pin; caf.mensaje = ""; }
  catch (e) { caf.error = e.message; }
  caf.cargando = false; pintarCafeteria();
}
async function actualizarCafeteria() {
  if (!caf.pin) return pintarCafeteria();
  caf.cargando = true; pintarCafeteria();
  try { caf.pedidos = await Api.pagosPendientes(caf.pin); caf.error = ""; }
  catch (e) { caf.error = e.message; }
  caf.cargando = false; pintarCafeteria();
}
async function resolverPago(codigo, aprobar) {
  if (caf.cargando) return;
  caf.cargando = true; caf.mensaje = ""; pintarCafeteria();
  try {
    await Api.resolverPago(codigo, aprobar, caf.pin);
    caf.mensaje = `Pedido ${codigo}: pago ${aprobar ? "aprobado" : "rechazado"}.`;
    caf.pedidos = await Api.pagosPendientes(caf.pin); caf.error = "";
  } catch (e) { caf.error = e.message; }
  caf.cargando = false; pintarCafeteria();
}
function salirCafeteria() { caf.pin = null; caf.pedidos = []; caf.mensaje = ""; caf.error = ""; pintarCafeteria(); }

// Buscar un pedido por su código (SCRUM-44)
async function consultar(evento) {
  evento.preventDefault();
  const codigo = $("codigo").value.trim().toUpperCase();
  const zona = $("resultado-consulta");
  if (!codigo) return;
  zona.innerHTML = '<p class="nota">Buscando…</p>';
  try {
    const pedido = await Api.consultarPedido(codigo);
    zona.innerHTML = pedido
      ? htmlPedido(pedido) + (pedido.estado !== "Pagado"
          ? `<button class="btn ancho-auto" type="button" onclick="irAPagar('${escapar(pedido.codigo)}')">Ir a pagar</button>` : "")
      : `<p class="aviso">No encontramos ese pedido (${escapar(codigo)}). Revisa el código e inténtalo de nuevo.</p>`;
  } catch (e) {
    zona.innerHTML = `<p class="aviso">${escapar(e.message)}</p>`;
  }
}
function irAPagar(codigo) { guardarLocal(LLAVE_ULTIMO, codigo); pago.pedido = null; location.hash = "#pago"; }

// Aviso de privacidad (SCRUM-47)
function abrirPrivacidad() { $("privacidad").showModal(); }
function cerrarPrivacidad() { $("privacidad").close(); }

// Cambia entre menú, pago, consulta y cafetería según lo que diga la URL
function mostrarVista() {
  const vista = { "#pago": "pago", "#consulta": "consulta", "#cafeteria": "cafeteria" }[location.hash] || "menu";
  for (const v of ["menu", "pago", "consulta", "cafeteria"]) $("vista-" + v).hidden = v !== vista;
  $("nav-menu").classList.toggle("activo", vista === "menu");
  $("nav-consulta").classList.toggle("activo", vista === "consulta");
  $("nav-cafeteria").classList.toggle("activo", vista === "cafeteria");
  if (vista === "pago") cargarPedidoParaPago();
  if (vista === "cafeteria") { caf.mensaje = ""; actualizarCafeteria(); }
  if (vista === "consulta" && !$("codigo").value) $("codigo").value = leerLocal(LLAVE_ULTIMO) || "";
  window.scrollTo(0, 0);
}

// Dibujar el menú y el carrito
function htmlDeImagen(img) { return `<img class="${img.clase}" src="${img.ruta}" alt="${img.alt}">`; }
function htmlImagen(producto, tamano) { return htmlDeImagen(datosImagen(producto, tamano)); }
function fotoMenu(producto) {
  const ruta = (producto.imagenes || {})[TAMANO_NEUTRO];
  return ruta ? `<img class="foto" src="${ruta}" alt="${producto.nombre}">` : producto.icono;
}
function textoLeche(leche) { return "Leche " + leche; }

function pintar() {
  const lista = productosValidos(PRODUCTOS);
  $("menu").innerHTML = lista.length
    ? lista.map(p => `<article class="card"><div class="tile">${fotoMenu(p)}<span class="badge">Disponible</span></div>
        <h3>${p.nombre}</h3><p class="desc">${p.desc}</p><p class="precio">${dinero(p.precio)}</p>
        <button class="btn" onclick="elegirProducto(${p.id})">+ Agregar</button></article>`).join("")
    : "<p>No hay productos disponibles por el momento.</p>";

  $("lista").innerHTML = carrito.length
    ? carrito.map((i, n) => `<li><div class="marco marco-carro">${htmlImagen(PRODUCTOS.find(x => x.id === i.idProducto), i.tamano)}</div>
        <span class="info"><strong>${i.nombre}</strong><br><small>${i.tamano} · ${textoLeche(i.leche)}</small><br>
          <small>${dinero(precioItem(i))} c/u</small> · <strong class="sub-item">${dinero(subtotalItem(i))}</strong>
          <span class="cantidad" role="group" aria-label="Cantidad de ${i.nombre}">
            <button type="button" onclick="cambiarCantidadItem(${n},-1)" aria-label="Disminuir cantidad de ${i.nombre}" ${i.cantidad <= 1 ? "disabled" : ""}>−</button>
            <output aria-live="polite">${i.cantidad}</output>
            <button type="button" onclick="cambiarCantidadItem(${n},1)" aria-label="Aumentar cantidad de ${i.nombre}" ${i.cantidad >= MAX_CANTIDAD ? "disabled" : ""}>+</button>
          </span></span>
        <button class="quitar" onclick="quitarDelCarrito(${n})" aria-label="Quitar ${i.nombre} del pedido">Quitar</button></li>`).join("")
    : '<li class="vacio">🧺<br>Aún no has agregado nada a tu pedido.</li>';
  const r = resumenCarrito(carrito);
  $("contador").textContent = r.unidades;
  $("items").textContent = r.unidades + (r.unidades === 1 ? " item" : " items");
  $("subtotal").textContent = dinero(r.subtotal);
  $("recargos").textContent = dinero(r.recargos);
  $("total").textContent = dinero(r.total);
}

// Ventana para personalizar la bebida (SCRUM-41)
// los vasitos de los botones de tamaño
const VASOS = {
  "Pequeño": '<path d="M3 14 L6 32 L16 32 L19 14 Z"/><rect class="tapa" x="2" y="11" width="18" height="3" rx="1"/>',
  "Mediano": '<path d="M2 8 L5 32 L17 32 L20 8 Z"/><rect class="tapa" x="1" y="5" width="20" height="3" rx="1"/>',
  "Grande":  '<path d="M1 3 L4 32 L18 32 L21 3 Z"/><rect class="tapa" x="0" y="0" width="22" height="3" rx="1"/>'
};
function iconoVaso(t) { return `<svg class="vaso" width="22" height="34" viewBox="0 0 22 34" aria-hidden="true">${VASOS[t] || ""}</svg>`; }

function pintarDetalle() {
  const p = estado.producto;
  if (!p) { $("detalle").innerHTML = ""; return; }
  $("detalle").innerHTML = `<h2 id="m-tit">${p.nombre}</h2>
    <div class="vista"><div class="marco marco-modal">
      <span id="vista-tam" class="vista-tam"></span>
      <img id="img-modal" src="${imagenActual.ruta}" class="${imagenActual.clase}" alt="${imagenActual.alt}">
    </div></div>
    <p class="precio" id="precio"></p>
    <p>Tamaño</p>
    <div class="tamanos" role="radiogroup" aria-label="Tamaño">${TAMANOS.map(t =>
      `<button type="button" class="op tam" role="radio" data-tamano="${t}" onclick="elegirTamano('${t}')">${iconoVaso(t)}<span>${t}</span></button>`).join("")}</div>
    <p>Leche</p>${Object.keys(LECHES).map(l =>
      `<button type="button" class="op" role="radio" data-leche="${l}" onclick="elegirLeche('${l}')">${l}${LECHES[l] ? " (+" + dinero(LECHES[l]) + ")" : ""}</button>`).join("")}
    <p id="aviso-modal" class="aviso" role="alert"></p>
    <button class="btn" onclick="agregarAlCarrito()">Agregar al carrito</button>
    <button class="cerrar" onclick="cerrarModal()">Cancelar</button>`;
  actualizarDetalle();
}
// solo cambiamos lo necesario para que la foto no parpadee al cambiar de tamaño
function actualizarDetalle() {
  const p = estado.producto;
  if (!p || !$("img-modal")) return;
  const img = $("img-modal");
  if (img.getAttribute("src") !== imagenActual.ruta) img.src = imagenActual.ruta;
  img.className = imagenActual.clase;
  img.alt = imagenActual.alt;
  $("vista-tam").textContent = estado.tamano || "Elige un tamaño";
  $("vista-tam").classList.toggle("sin-elegir", !estado.tamano);
  $("precio").textContent = dinero(precioUnitario(p, estado.leche));
  document.querySelectorAll("#detalle [data-tamano]").forEach(b => {
    const sel = b.dataset.tamano === estado.tamano;
    b.classList.toggle("sel", sel); b.setAttribute("aria-checked", sel);
  });
  document.querySelectorAll("#detalle [data-leche]").forEach(b => {
    const sel = b.dataset.leche === estado.leche;
    b.classList.toggle("sel", sel); b.setAttribute("aria-checked", sel);
  });
  $("aviso-modal").textContent = avisoModal;
}

// Resumen antes de confirmar y pantalla de pago
function pintarResumen() {
  const r = resumenCarrito(carrito);
  $("resumen-cuerpo").innerHTML = `<h2 id="r-tit">Confirma tu pedido</h2>
    <ul class="resumen-lista">${carrito.map(i => `<li><span>${i.cantidad} × ${i.nombre}<br><small>${i.tamano} · ${textoLeche(i.leche)}${i.recargo ? " (+" + dinero(i.recargo) + " c/u)" : ""}</small></span>
      <strong>${dinero(subtotalItem(i))}</strong></li>`).join("")}</ul>
    <p class="linea"><span>Subtotal</span><span>${dinero(r.subtotal)}</span></p>
    <p class="linea"><span>Recargos</span><span>${dinero(r.recargos)}</span></p>
    <p class="linea total"><span>Total</span><span>${dinero(r.total)}</span></p>
    <p class="peq">Al confirmar aceptas el <button class="enlace en-linea" type="button" onclick="abrirPrivacidad()">aviso de privacidad y términos</button>.</p>
    <p class="aviso" role="alert">${escapar(checkout.error)}</p>
    <button class="btn" type="button" onclick="confirmarPedido()" ${checkout.enviando ? "disabled" : ""}>${checkout.enviando ? "Confirmando…" : "Confirmar y pagar"}</button>
    <button class="cerrar" type="button" onclick="cerrarResumen()" ${checkout.enviando ? "disabled" : ""}>Seguir comprando</button>`;
}

// estado del último pago, como lo ve el cliente
function htmlEstadoPago(pedido) {
  const ultimo = ultimoPago(pedido);
  if (!ultimo) return "Sin pago";
  if (ultimo.estado === "Pendiente") return ultimo.metodo === "Transferencia" ? "En verificación" : "Pendiente en caja";
  return ultimo.estado;
}
function claseEstadoPago(pedido) {
  const ultimo = ultimoPago(pedido);
  return "est-" + (ultimo ? ultimo.estado.toLowerCase() : "sin-pago");
}
function htmlPedido(pedido) {
  const fecha = new Date(pedido.creado_en).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
  return `<section class="tarjeta-pedido">
    <div class="cab-pedido"><div><small>Pedido</small><h2>${escapar(pedido.codigo)}</h2><small>${escapar(fecha)}</small></div>
      <div class="estados"><span class="estado est-${escapar(pedido.estado).toLowerCase()}">Pedido: ${escapar(pedido.estado)}</span>
      <span class="estado ${claseEstadoPago(pedido)}">Pago: ${escapar(htmlEstadoPago(pedido))}</span></div></div>
    <ul class="resumen-lista">${pedido.items.map(i => `<li><span>${i.cantidad} × ${escapar(i.nombre)}<br><small>${escapar(i.tamano)} · Leche ${escapar(i.leche)} · ${dinero(i.precio_unitario)} c/u</small></span>
      <strong>${dinero(i.subtotal)}</strong></li>`).join("")}</ul>
    <p class="linea"><span>Subtotal</span><span>${dinero(pedido.subtotal)}</span></p>
    <p class="linea"><span>Recargos</span><span>${dinero(pedido.recargos)}</span></p>
    <p class="linea total"><span>Total</span><span>${dinero(pedido.total)}</span></p>
    ${pedido.pagos && pedido.pagos.length ? `<details><summary>Intentos de pago (${pedido.pagos.length})</summary><ul class="pagos">
      ${pedido.pagos.map(g => `<li>${escapar(g.estado)} · ${escapar(g.metodo)} · ${dinero(g.monto)} · ${escapar(g.referencia)}</li>`).join("")}</ul></details>` : ""}
  </section>`;
}

function pintarPago() {
  const zona = $("pago");
  if (pago.cargando) { zona.innerHTML = '<p class="nota">Cargando tu pedido…</p>'; return; }
  const pedido = pago.pedido;
  if (!pedido) {
    zona.innerHTML = `<p>No hay un pedido para pagar. <a href="#menu">Vuelve al menú</a> o <a href="#consulta">consulta un pedido</a>.</p>
      ${pago.error ? `<p class="aviso">${escapar(pago.error)}</p>` : ""}`;
    return;
  }
  const ultimo = ultimoPago(pedido);
  const codigo = escapar(pedido.codigo);
  let estadoPago = "";
  if (pedido.estado === "Pagado") {
    estadoPago = `<p class="ok" role="status">Pago aprobado. Tu pedido quedó pagado y ya se puede preparar.</p>
      <p><a href="#consulta">Ver mi pedido</a> · <a href="#menu">Hacer otro pedido</a></p>`;
  } else if (ultimo && ultimo.estado === "Pendiente") {
    estadoPago = (ultimo.metodo === "Transferencia"
      ? `<p class="pendiente" role="status">Recibimos tu referencia ${escapar(ultimo.referencia.replace(/^TRF-/, ""))}. La cafetería está verificando la transferencia de ${dinero(ultimo.monto)}.</p>`
      : `<p class="pendiente" role="status">Tu pedido quedó reservado. Muestra el código <strong>${codigo}</strong> en caja y paga ${dinero(ultimo.monto)} al recogerlo.</p>`)
      + `<button class="btn ancho-auto" type="button" onclick="cargarPedidoParaPago(true)">Actualizar estado del pago</button>`;
  } else {
    const medio = pago.medio === "transferencia" ? "transferencia" : "recoger";
    const t = Pasarela.transferencia;
    estadoPago = `${ultimo && ultimo.estado === "Rechazado"
        ? `<p class="aviso" role="alert">La cafetería rechazó el pago anterior (${escapar(ultimo.metodo)}). No se hizo ningún cobro; puedes intentarlo de nuevo.</p>` : ""}
    <form class="form-pago" onsubmit="pagar(event)" novalidate>
      <fieldset ${pago.procesando ? "disabled" : ""}><legend>Elige cómo pagar</legend>
        ${Pasarela.medios.map(m => `<label class="medio${m.id === medio ? " sel" : ""}" data-medio="${m.id}">
          <input type="radio" name="medio" value="${m.id}" ${m.id === medio ? "checked" : ""} onchange="elegirMedio('${m.id}')">
          <span><strong>${escapar(m.nombre)}</strong><br><small>${escapar(m.detalle)}</small></span></label>`).join("")}
        <div id="panel-transferencia" class="panel-transf" ${medio === "transferencia" ? "" : "hidden"}>
          <p>Transfiere <strong>${dinero(pedido.total)}</strong> a la llave <strong>${escapar(t.llave)}</strong> (${escapar(t.titular)}) desde ${escapar(t.medios)}.</p>
          <p class="nota">Escribe <strong>${codigo}</strong> en el mensaje de la transferencia.</p>
          <label for="referencia">Número de referencia de la transferencia</label>
          <input id="referencia" name="referencia" placeholder="M12345678" maxlength="20" autocomplete="off" value="${escapar(pago.referencia)}" oninput="$('error-pago').textContent=''">
        </div>
        <p id="error-pago" class="aviso" role="alert"></p>
      </fieldset>
      <button id="btn-pagar" class="btn" type="submit" ${pago.procesando ? "disabled" : ""}>${pago.procesando ? "Enviando…" : medio === "transferencia" ? "Enviar referencia" : "Confirmar pago al recoger"}</button>
      <p class="peq">Lattely no pide ni guarda datos de tarjeta.</p>
    </form>`;
  }
  zona.innerHTML = `<p class="nota">Guarda tu código <strong>${codigo}</strong> para consultar tu pedido.</p>
    ${htmlPedido(pedido)}
    ${pago.error ? `<p class="aviso" role="alert">${escapar(pago.error)}</p>` : ""}
    ${estadoPago}`;
}

function pintarCafeteria() {
  const zona = $("cafeteria");
  const aviso = caf.error ? `<p class="aviso" role="alert">${escapar(caf.error)}</p>` : "";
  if (!caf.pin) {
    zona.innerHTML = `<form class="consulta" onsubmit="entrarCafeteria(event)">
        <label for="pin">PIN de la cafetería</label>
        <div class="fila"><input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" class="sin-mayus">
        <button class="btn" type="submit" ${caf.cargando ? "disabled" : ""}>${caf.cargando ? "Entrando…" : "Entrar"}</button></div>
      </form>${aviso}<p class="nota">Solo para el personal: aquí se aprueban o rechazan los pagos al recoger y las transferencias.</p>`;
    return;
  }
  const lista = caf.pedidos.map(p => {
    const g = ultimoPago(p);
    const fecha = new Date(g.creado_en).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
    const c = escapar(p.codigo);
    return `<li class="tarjeta-pedido pago-pendiente">
      <div><strong>${c}</strong> · ${dinero(g.monto)}<br><small>${escapar(g.metodo)} · ${escapar(g.referencia)} · ${escapar(fecha)}</small></div>
      <div class="acciones"><button class="btn" type="button" onclick="resolverPago('${c}', true)" ${caf.cargando ? "disabled" : ""}>${g.metodo === "Transferencia" ? "Aprobar" : "Marcar pagado"}</button>
      <button class="btn secundario" type="button" onclick="resolverPago('${c}', false)" ${caf.cargando ? "disabled" : ""}>Rechazar</button></div></li>`;
  }).join("");
  zona.innerHTML = `${caf.mensaje ? `<p class="ok" role="status">${escapar(caf.mensaje)}</p>` : ""}${aviso}
    ${caf.pedidos.length ? `<ul class="lista-pendientes">${lista}</ul>` : `<p class="nota">No hay pagos pendientes por revisar.</p>`}
    <p><button class="btn ancho-auto" type="button" onclick="actualizarCafeteria()" ${caf.cargando ? "disabled" : ""}>${caf.cargando ? "Cargando…" : "Actualizar"}</button>
    <button class="enlace en-linea" type="button" onclick="salirCafeteria()">Salir</button></p>`;
}

// Al abrir la página
$("modal").addEventListener("close", () => { estado.producto = null; estado.tamano = null; imagenActual = null; avisoModal = ""; $("detalle").innerHTML = ""; pintar(); });
$("resumen").addEventListener("cancel", e => { if (checkout.enviando) e.preventDefault(); });
window.addEventListener("hashchange", mostrarVista);
pintar();
mostrarVista();

// Las cuentas del carrito y del pedido. No toca la pantalla, por eso también la usamos en las pruebas.

const TAMANO_NEUTRO = "Mediano";
const MAX_CANTIDAD = 20;

function productosValidos(lista) {
  // si un producto no tiene precio no lo mostramos
  return lista.filter(p => typeof p.precio === "number" && p.precio > 0);
}
function recargoLeche(leche) { return LECHES[leche] || 0; }
// Té Chai y Americano Frío no llevan leche: no se elige y no tienen recargo
function admiteLeche(producto) { return !!producto && producto.usaLeche !== false; }
// devuelve la leche que se guarda para ese producto, o null si no es válida
function lecheValida(producto, leche) {
  if (!admiteLeche(producto)) return SIN_LECHE;
  return Object.prototype.hasOwnProperty.call(LECHES, leche) ? leche : null;
}
function precioUnitario(producto, leche) {
  // siempre partimos del precio base, así la leche de almendras no se suma dos veces (BUG-01)
  return producto.precio + (admiteLeche(producto) ? recargoLeche(leche) : 0);
}
const dinero = n => "$" + Number(n || 0).toLocaleString("es-CO");

// foto según el tamaño elegido; si no han elegido, se muestra la mediana
function claseTamano(t) { return "img-" + t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function datosImagen(producto, tamano) {
  const t = tamano || TAMANO_NEUTRO;
  return { ruta: (producto.imagenes || {})[t] || "", clase: claseTamano(t), alt: `${producto.nombre}, tamaño ${t}` };
}

// Carrito: si agregan la misma bebida igualita, solo sube la cantidad
function agregarItem(carrito, producto, tamano, leche) {
  if (!producto) return "Elige un producto.";
  if (!TAMANOS.includes(tamano)) return "Faltan opciones por seleccionar: elige un tamaño.";
  leche = lecheValida(producto, leche);
  if (!leche) return "Elige un tipo de leche válido.";
  const igual = carrito.find(i => i.idProducto === producto.id && i.tamano === tamano && i.leche === leche);
  if (igual) {
    if (igual.cantidad >= MAX_CANTIDAD) return `Máximo ${MAX_CANTIDAD} unidades por producto.`;
    igual.cantidad += 1;
  } else {
    carrito.push({ idProducto: producto.id, nombre: producto.nombre, tamano, leche,
                   precioBase: producto.precio, recargo: recargoLeche(leche), cantidad: 1 });
  }
  return null;
}
function cambiarCantidad(carrito, indice, delta) {
  // la cantidad va de 1 a 20; para dejarla en 0 está el botón Quitar
  const item = carrito[indice];
  if (!item || !Number.isInteger(delta)) return false;
  const nueva = item.cantidad + delta;
  if (nueva < 1 || nueva > MAX_CANTIDAD) return false;
  item.cantidad = nueva;
  return true;
}
function quitarItem(carrito, indice) {
  if (!Number.isInteger(indice) || indice < 0 || indice >= carrito.length) return false;
  carrito.splice(indice, 1);
  return true;
}
function precioItem(item) { return item.precioBase + item.recargo; }
function subtotalItem(item) { return precioItem(item) * item.cantidad; }
function resumenCarrito(items) {
  return items.reduce((r, i) => {
    r.unidades += i.cantidad;
    r.subtotal += i.precioBase * i.cantidad;
    r.recargos += i.recargo * i.cantidad;
    r.total += subtotalItem(i);
    return r;
  }, { unidades: 0, subtotal: 0, recargos: 0, total: 0 });
}
function totalCarrito(items) { return resumenCarrito(items).total; }

// al recargar la página recuperamos el carrito, pero con los precios del menú y no con los guardados
function rehidratarCarrito(guardado) {
  if (!Array.isArray(guardado)) return [];
  const carrito = [];
  for (const g of guardado) {
    const p = productosValidos(PRODUCTOS).find(x => x && g && x.id === g.idProducto);
    const cant = Number.isInteger(g && g.cantidad) ? Math.min(Math.max(g.cantidad, 1), MAX_CANTIDAD) : 1;
    if (!p || !TAMANOS.includes(g.tamano) || !lecheValida(p, g.leche)) continue;
    for (let n = 0; n < cant; n++) agregarItem(carrito, p, g.tamano, g.leche);
  }
  return carrito;
}

// Revisar el carrito antes de confirmar (SCRUM-42)
function validarCarrito(items) {
  if (!items.length) return "Tu carrito está vacío: agrega al menos una bebida para confirmar.";
  for (const i of items) {
    if (!TAMANOS.includes(i.tamano)) return `Falta elegir el tamaño de ${i.nombre}.`;
    if (i.leche !== SIN_LECHE && !(i.leche in LECHES)) return `Falta elegir la leche de ${i.nombre}.`;
    if (!Number.isInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > MAX_CANTIDAD) return `Cantidad no válida en ${i.nombre}.`;
  }
  return null;
}
// al guardar el pedido solo mandamos qué pidieron, los precios se vuelven a calcular
function itemsParaPedido(items) {
  return items.map(i => ({ producto_id: i.idProducto, tamano: i.tamano, leche: i.leche, cantidad: i.cantidad }));
}
function calcularPedido(itemsPedido) {
  if (!Array.isArray(itemsPedido) || !itemsPedido.length) throw new Error("El carrito está vacío.");
  const items = itemsPedido.map(it => {
    const p = productosValidos(PRODUCTOS).find(x => x.id === it.producto_id);
    if (!p) throw new Error("Hay un producto que no existe o no está disponible.");
    if (!TAMANOS.includes(it.tamano)) throw new Error(`Falta elegir el tamaño de ${p.nombre}.`);
    const leche = lecheValida(p, it.leche);
    if (!leche) throw new Error(`Tipo de leche no válido en ${p.nombre}.`);
    if (!Number.isInteger(it.cantidad) || it.cantidad < 1 || it.cantidad > MAX_CANTIDAD) throw new Error(`Cantidad no válida en ${p.nombre}.`);
    const recargo = recargoLeche(leche);
    return { producto_id: p.id, nombre: p.nombre, tamano: it.tamano, leche, cantidad: it.cantidad,
             precio_unitario: p.precio + recargo, recargo_leche: recargo, subtotal: (p.precio + recargo) * it.cantidad };
  });
  const subtotal = items.reduce((s, i) => s + (i.precio_unitario - i.recargo_leche) * i.cantidad, 0);
  const recargos = items.reduce((s, i) => s + i.recargo_leche * i.cantidad, 0);
  return { items, subtotal, recargos, total: subtotal + recargos };
}

function nuevoUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ultimoPago(pedido) {
  const pagos = (pedido && pedido.pagos) || [];
  return pagos.length ? pagos[pagos.length - 1] : null;
}

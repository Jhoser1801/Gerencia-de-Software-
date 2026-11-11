// Pruebas de las cuentas del carrito, el pedido y el pago.
// Se corren desde la carpeta lattely con: node --test pruebas/logica.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function cargarApp() {
  const almacen = new Map();
  const contexto = vm.createContext({
    console, setTimeout, crypto: globalThis.crypto,
    localStorage: {
      getItem: k => (almacen.has(k) ? almacen.get(k) : null),
      setItem: (k, v) => almacen.set(k, String(v)),
      removeItem: k => almacen.delete(k)
    }
  });
  for (const archivo of ["datos.js", "logica.js", "config.js", "api.js", "pasarela.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", archivo), "utf8"), contexto, { filename: archivo });
  }
  // así leemos las variables de los archivos de la página
  return nombre => vm.runInContext(nombre, contexto);
}
const producto = (app, nombre) => app("PRODUCTOS").find(p => p.nombre === nombre);

test("HU-02: precios de Latte y Té Chai iguales a datos.js", () => {
  const app = cargarApp();
  assert.equal(app("precioUnitario")(producto(app, "Latte"), "Entera"), 5200);
  assert.equal(app("precioUnitario")(producto(app, "Té Chai"), "Entera"), 4800);
});

test("BUG-01: alternar Almendras/Entera nunca acumula recargos", () => {
  const app = cargarApp();
  const latte = producto(app, "Latte");
  for (let n = 0; n < 5; n++) {
    assert.equal(app("precioUnitario")(latte, "Almendras"), 7200);
    assert.equal(app("precioUnitario")(latte, "Entera"), 5200);
  }
});

test("HU-05 inválido: no se agrega sin tamaño", () => {
  const app = cargarApp();
  const carrito = [];
  const error = app("agregarItem")(carrito, producto(app, "Latte"), null, "Entera");
  assert.match(error, /tamaño/);
  assert.equal(carrito.length, 0);
});

test("SCRUM-40 válido: Latte Mediano Almendras ×3 = $21.600", () => {
  const app = cargarApp();
  const carrito = [];
  app("agregarItem")(carrito, producto(app, "Latte"), "Mediano", "Almendras");
  app("cambiarCantidad")(carrito, 0, 1);
  app("cambiarCantidad")(carrito, 0, 1);
  assert.equal(carrito[0].cantidad, 3);
  assert.equal(app("subtotalItem")(carrito[0]), 21600);
  const r = app("resumenCarrito")(carrito);
  assert.deepEqual({ ...r }, { unidades: 3, subtotal: 15600, recargos: 6000, total: 21600 });
});

test("SCRUM-40 límite: la cantidad no baja de 1 ni pasa de 20", () => {
  const app = cargarApp();
  const carrito = [];
  app("agregarItem")(carrito, producto(app, "Cappuccino"), "Grande", "Entera");
  assert.equal(app("cambiarCantidad")(carrito, 0, -1), false);
  assert.equal(carrito[0].cantidad, 1);
  for (let n = 0; n < 30; n++) app("cambiarCantidad")(carrito, 0, 1);
  assert.equal(carrito[0].cantidad, 20);
});

test("SCRUM-40: subir y bajar varias veces no duplica el recargo", () => {
  const app = cargarApp();
  const carrito = [];
  app("agregarItem")(carrito, producto(app, "Latte"), "Pequeño", "Almendras");
  for (let n = 0; n < 4; n++) { app("cambiarCantidad")(carrito, 0, 1); app("cambiarCantidad")(carrito, 0, -1); }
  assert.equal(app("totalCarrito")(carrito), 7200);
});

test("Misma bebida con la misma configuración se agrupa; distinta leche no", () => {
  const app = cargarApp();
  const carrito = [];
  const latte = producto(app, "Latte");
  app("agregarItem")(carrito, latte, "Mediano", "Entera");
  app("agregarItem")(carrito, latte, "Mediano", "Entera");
  app("agregarItem")(carrito, latte, "Mediano", "Almendras");
  assert.equal(carrito.length, 2);
  assert.equal(carrito[0].cantidad, 2);
});

test("HU-06: Latte Almendras + Americano Frío Pequeño = $11.000", () => {
  const app = cargarApp();
  const carrito = [];
  app("agregarItem")(carrito, producto(app, "Latte"), "Mediano", "Almendras");
  app("agregarItem")(carrito, producto(app, "Americano Frío"), "Pequeño", "Entera");
  assert.equal(app("totalCarrito")(carrito), 11000);
});

test("Carrito guardado manipulado: se recalcula con los precios de datos.js", () => {
  const app = cargarApp();
  const carrito = app("rehidratarCarrito")([
    { idProducto: 1, tamano: "Grande", leche: "Entera", precioBase: 1, recargo: 0, cantidad: 2 },
    { idProducto: 99, tamano: "Grande", leche: "Entera", cantidad: 1 },
    { idProducto: 2, tamano: "Gigante", leche: "Entera", cantidad: 1 }
  ]);
  assert.equal(carrito.length, 1);
  assert.equal(app("totalCarrito")(carrito), 10400);
});

test("SCRUM-42 inválido: carrito vacío no se puede confirmar", () => {
  const app = cargarApp();
  assert.match(app("validarCarrito")([]), /vacío/);
});

test("SCRUM-42/43: confirmar guarda el pedido y doble envío no lo duplica", async () => {
  const app = cargarApp();
  const Api = app("Api");
  assert.equal(Api.modo, "local");
  const items = [{ producto_id: 1, tamano: "Mediano", leche: "Almendras", cantidad: 1 },
                 { producto_id: 3, tamano: "Pequeño", leche: "Entera", cantidad: 1 }];
  const clave = app("nuevoUUID")();
  const [a, b] = await Promise.all([Api.confirmarPedido(items, clave), Api.confirmarPedido(items, clave)]);
  assert.equal(a.codigo, b.codigo);
  assert.equal(a.total, 11000);
  assert.equal(a.recargos, 2000);
  assert.equal(a.estado, "Confirmado");
  const consultado = await Api.consultarPedido(a.codigo.toLowerCase());
  assert.equal(consultado.items.length, 2);
});

test("SCRUM-43: el servidor ignora precios del navegador y valida el tamaño", async () => {
  const app = cargarApp();
  const Api = app("Api");
  const p = await Api.confirmarPedido([{ producto_id: 2, tamano: "Grande", leche: "Entera", cantidad: 2, precio: 1 }], app("nuevoUUID")());
  assert.equal(p.total, 9000);
  await assert.rejects(Api.confirmarPedido([{ producto_id: 2, tamano: null, leche: "Entera", cantidad: 1 }], app("nuevoUUID")()), /tamaño/);
  await assert.rejects(Api.confirmarPedido([], app("nuevoUUID")()), /vacío/);
});

test("SCRUM-44 inválido: código inexistente devuelve null", async () => {
  const app = cargarApp();
  assert.equal(await app("Api").consultarPedido("LAT-NOEXISTE"), null);
});

const PIN = "2468";
async function pedidoDePrueba(app, productoId = 4) {
  return app("Api").confirmarPedido([{ producto_id: productoId, tamano: "Mediano", leche: "Entera", cantidad: 1 }], app("nuevoUUID")());
}

test("SCRUM-45: pagar al recoger queda pendiente y la cafetería lo marca pagado una sola vez", async () => {
  const app = cargarApp();
  const Api = app("Api"); const Pasarela = app("Pasarela");
  const pedido = await pedidoDePrueba(app);

  const r = Pasarela.iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "recoger" });
  assert.equal(r.estado, "Pendiente");
  assert.equal(r.metodo, "Pagar al recoger");
  let actual = await Api.registrarPago(pedido.codigo, r);
  assert.equal(actual.estado, "Confirmado");
  assert.equal(app("ultimoPago")(actual).estado, "Pendiente");
  assert.equal(app("ultimoPago")(actual).monto, 4800);

  const otro = Pasarela.iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "recoger" });
  await assert.rejects(Api.registrarPago(pedido.codigo, otro), /pago pendiente/);

  actual = await Api.resolverPago(pedido.codigo, true, PIN);
  assert.equal(actual.estado, "Pagado");
  assert.equal(app("ultimoPago")(actual).estado, "Aprobado");
  await assert.rejects(Api.resolverPago(pedido.codigo, true, PIN), /no tiene un pago pendiente/);
  const r3 = Pasarela.iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "recoger" });
  await assert.rejects(Api.registrarPago(pedido.codigo, r3), /ya está pagado/);
});

test("SCRUM-45/46: PSE cancelado y luego aprobado = 2 registros y Pagado una sola vez", async () => {
  const app = cargarApp();
  const Api = app("Api"); const Pasarela = app("Pasarela");
  const pedido = await pedidoDePrueba(app);
  const iniciar = (banco, tipoPersona = "Natural") =>
    Pasarela.iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "pse", banco, tipoPersona });

  assert.throws(() => iniciar(""), /Elige tu banco/);
  assert.throws(() => iniciar("Banco Inventado"), /Elige tu banco/);
  assert.throws(() => iniciar("Bancolombia", ""), /tipo de persona/);

  const t1 = iniciar("Bancolombia");
  assert.match(t1.cus, /^[1-9]\d{9}$/);
  assert.equal(t1.monto, 4800);
  let actual = await Api.registrarPago(pedido.codigo, Pasarela.responderBanco(t1, false));
  assert.equal(actual.estado, "Confirmado");
  assert.equal(app("ultimoPago")(actual).estado, "Rechazado");

  const t2 = iniciar("Nequi", "Jurídica");
  const aprobado = Pasarela.responderBanco(t2, true);
  actual = await Api.registrarPago(pedido.codigo, aprobado);
  assert.equal(actual.estado, "Pagado");
  assert.equal(actual.pagos.length, 2);
  assert.equal(actual.pagos[1].banco, "Nequi");
  assert.equal(actual.pagos[1].referencia, "PSE-" + t2.cus);
  assert.equal(actual.pagos[1].monto, 4800);
  assert.ok(!JSON.stringify(actual).match(/tarjeta\s*\d|cvv|contraseña|password/i));

  await assert.rejects(Api.registrarPago(pedido.codigo, Pasarela.responderBanco(iniciar("Davivienda"), true)), /ya está pagado/);
});

test("Té Chai y Americano Frío no llevan leche ni recargo", async () => {
  const app = cargarApp();
  const te = producto(app, "Té Chai"), americano = producto(app, "Americano Frío");
  assert.equal(app("admiteLeche")(te), false);
  assert.equal(app("admiteLeche")(producto(app, "Latte")), true);
  assert.equal(app("precioUnitario")(te, "Almendras"), 4800);
  const carrito = [];
  app("agregarItem")(carrito, americano, "Grande", "Almendras");
  assert.equal(carrito[0].leche, "Sin leche");
  assert.equal(app("totalCarrito")(carrito), 3800);
  assert.equal(app("validarCarrito")(carrito), null);
  const p = await app("Api").confirmarPedido([{ producto_id: 4, tamano: "Pequeño", leche: "Almendras", cantidad: 2 }], app("nuevoUUID")());
  assert.equal(p.items[0].leche, "Sin leche");
  assert.equal(p.recargos, 0);
  assert.equal(p.total, 9600);
  await assert.rejects(app("Api").confirmarPedido([{ producto_id: 1, tamano: "Pequeño", leche: "Sin leche", cantidad: 1 }], app("nuevoUUID")()), /leche no válido/);
});

test("Seguridad: un pago al recoger solo lo aprueba la cafetería, con su PIN", async () => {
  const app = cargarApp();
  const Api = app("Api");
  const pedido = await pedidoDePrueba(app, 1);
  await assert.rejects(Api.registrarPago(pedido.codigo, { estado: "Aprobado", metodo: "Pagar al recoger", referencia: "CAJA-FALSO123" }), /solo lo aprueba la cafetería/);
  await assert.rejects(Api.registrarPago(pedido.codigo, { estado: "Pendiente", metodo: "PSE", banco: "Nequi", referencia: "PSE-1" }), /Respuesta del banco/);
  await assert.rejects(Api.registrarPago(pedido.codigo, { estado: "Aprobado", metodo: "PSE", banco: "Banco Falso", referencia: "PSE-2" }), /Elige tu banco/);
  await assert.rejects(Api.registrarPago(pedido.codigo, { estado: "Pendiente", metodo: "Tarjeta", referencia: "X-1" }), /no válido/);

  await Api.registrarPago(pedido.codigo, app("Pasarela").iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "recoger" }));
  await assert.rejects(Api.pagosPendientes("0000"), /PIN incorrecto/);
  await assert.rejects(Api.resolverPago(pedido.codigo, true, ""), /PIN incorrecto/);
  const pendientes = await Api.pagosPendientes(PIN);
  assert.deepEqual([...pendientes.map(p => p.codigo)], [pedido.codigo]);
  assert.equal((await Api.consultarPedido(pedido.codigo)).estado, "Confirmado");
});

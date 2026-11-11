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

test("SCRUM-45/46: transferencia rechazada y luego aprobada = 2 registros y Pagado una sola vez", async () => {
  const app = cargarApp();
  const Api = app("Api"); const Pasarela = app("Pasarela");
  const pedido = await pedidoDePrueba(app);
  const iniciar = ref => Pasarela.iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "transferencia", referenciaTransferencia: ref });

  assert.throws(() => iniciar(""), /referencia/);
  assert.throws(() => iniciar("12 34"), /6 y 20/);
  assert.throws(() => iniciar("123"), /6 y 20/);

  await Api.registrarPago(pedido.codigo, iniciar("m1234567"));
  let actual = await Api.resolverPago(pedido.codigo, false, PIN);
  assert.equal(actual.estado, "Confirmado");
  assert.equal(app("ultimoPago")(actual).estado, "Rechazado");

  await assert.rejects(Api.registrarPago(pedido.codigo, iniciar("M1234567")), /ya se registró/);
  await Api.registrarPago(pedido.codigo, iniciar("M7654321"));
  actual = await Api.resolverPago(pedido.codigo, true, PIN);
  assert.equal(actual.estado, "Pagado");
  assert.equal(actual.pagos.length, 2);
  assert.equal(actual.pagos[1].referencia, "TRF-M7654321");
  assert.equal(actual.pagos[1].monto, 4800);
  assert.ok(!JSON.stringify(actual).match(/tarjeta\s*\d|cvv/i));
});

test("Seguridad: el cliente no puede aprobar un pago y la cafetería necesita el PIN", async () => {
  const app = cargarApp();
  const Api = app("Api");
  const pedido = await pedidoDePrueba(app, 1);
  await assert.rejects(Api.registrarPago(pedido.codigo, { estado: "Aprobado", metodo: "Transferencia", referencia: "TRF-FALSO123" }), /Solo la cafetería/);
  await assert.rejects(Api.registrarPago(pedido.codigo, { estado: "Pendiente", metodo: "Tarjeta", referencia: "X-1" }), /no válido/);

  await Api.registrarPago(pedido.codigo, app("Pasarela").iniciarPago({ monto: pedido.total, referenciaPedido: pedido.codigo, medio: "recoger" }));
  await assert.rejects(Api.pagosPendientes("0000"), /PIN incorrecto/);
  await assert.rejects(Api.resolverPago(pedido.codigo, true, ""), /PIN incorrecto/);
  const pendientes = await Api.pagosPendientes(PIN);
  assert.deepEqual([...pendientes.map(p => p.codigo)], [pedido.codigo]);
  assert.equal((await Api.consultarPedido(pedido.codigo)).estado, "Confirmado");
});

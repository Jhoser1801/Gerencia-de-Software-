// Pasarela de pagos de Lattely (SCRUM-45). No usa ninguna API externa ni pide datos de tarjeta ni claves.
// Dos medios de pago:
//   - Pagar al recoger: el pago queda "Pendiente" hasta que la cafetería lo marca pagado (vista Cafetería).
//   - PSE: como en el botón PSE de los bancos colombianos. El cliente elige su banco y el tipo de persona,
//     pasa a la pantalla del banco con el valor y el código CUS, y autoriza o cancela el débito.
//     El banco responde "Aprobado" o "Rechazado". En esta versión la pantalla del banco está dentro de
//     Lattely; con PSE real esa respuesta llegaría del banco al servidor.

const BANCOS_PSE = [
  "Banco Agrario", "Banco AV Villas", "Banco Caja Social", "Banco de Bogotá", "Banco de Occidente",
  "Banco Falabella", "Banco Popular", "Bancolombia", "BBVA Colombia", "Daviplata", "Davivienda",
  "Itaú", "Nequi", "Scotiabank Colpatria"
];
const TIPOS_PERSONA = ["Natural", "Jurídica"];

const MEDIOS_PAGO = [
  { id: "recoger", nombre: "Pagar al recoger", detalle: "Pagas en caja con efectivo o tarjeta cuando recojas tu pedido." },
  { id: "pse", nombre: "PSE", detalle: "Débito desde tu cuenta de ahorros o corriente en tu banco." }
];

const Pasarela = {
  medios: MEDIOS_PAGO,
  bancos: BANCOS_PSE,
  tiposPersona: TIPOS_PERSONA,
  comercio: "Lattely Café",

  // Pagar al recoger: devuelve el pago pendiente. PSE: devuelve la transacción que se autoriza en el banco.
  iniciarPago({ monto, referenciaPedido, medio, banco, tipoPersona }) {
    const elegido = MEDIOS_PAGO.find(m => m.id === medio);
    if (!elegido) throw new Error("Elige cómo quieres pagar.");
    if (!Number.isInteger(monto) || monto <= 0) throw new Error("El monto a pagar no es válido.");
    if (!referenciaPedido) throw new Error("Falta el código del pedido.");
    if (medio === "recoger") {
      return { estado: "Pendiente", metodo: elegido.nombre, banco: null,
               referencia: "CAJA-" + nuevoUUID().replace(/-/g, "").slice(0, 10).toUpperCase() };
    }
    if (!BANCOS_PSE.includes(banco)) throw new Error("Elige tu banco.");
    if (!TIPOS_PERSONA.includes(tipoPersona)) throw new Error("Elige el tipo de persona.");
    return { medio: "pse", banco, tipoPersona, monto, referenciaPedido, cus: nuevoCUS() };
  },

  // Respuesta del banco a una transacción PSE: el cliente autorizó o canceló el débito
  responderBanco(transaccion, autorizado) {
    if (!transaccion || transaccion.medio !== "pse" || !transaccion.cus) throw new Error("No hay una transacción PSE en curso.");
    return { estado: autorizado ? "Aprobado" : "Rechazado", metodo: "PSE", banco: transaccion.banco,
             referencia: "PSE-" + transaccion.cus };
  }
};

// CUS: código único de seguimiento de 10 dígitos que entrega PSE por cada transacción
function nuevoCUS() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return [...b].map(x => x % 10).join("").replace(/^0/, "1");
}

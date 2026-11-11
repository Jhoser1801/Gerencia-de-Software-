// Pasarela de pagos de Lattely (SCRUM-45). No usa ninguna API externa ni pide datos de tarjeta.
// Dos medios de pago:
//   - Pagar al recoger: el cliente paga en caja con el código del pedido.
//   - Transferencia: el cliente transfiere a la llave de Lattely y escribe el número de referencia.
// En los dos casos el pago queda "Pendiente" hasta que la cafetería lo revisa y lo aprueba o lo rechaza
// desde la vista "Cafetería" (api.js: resolverPago).

const DATOS_TRANSFERENCIA = {
  llave: "@lattely",
  titular: "Lattely Café",
  medios: "Nequi, Daviplata o cualquier banco con llave Bre-B"
};

const MEDIOS_PAGO = [
  { id: "recoger", nombre: "Pagar al recoger", detalle: "Pagas en caja con efectivo o tarjeta cuando recojas tu pedido." },
  { id: "transferencia", nombre: "Transferencia", detalle: "Nequi, Daviplata o llave Bre-B. Después escribes el número de referencia." }
];

function validarReferenciaTransferencia(referencia) {
  const r = String(referencia || "").trim();
  if (!r) return "Escribe el número de referencia que te dio tu banco.";
  if (!/^[A-Za-z0-9-]{6,20}$/.test(r)) return "La referencia debe tener entre 6 y 20 letras o números, sin espacios.";
  return "";
}

const Pasarela = {
  medios: MEDIOS_PAGO,
  transferencia: DATOS_TRANSFERENCIA,
  // Devuelve el pago pendiente que se guarda con api.js (registrarPago)
  iniciarPago({ monto, referenciaPedido, medio, referenciaTransferencia }) {
    const elegido = MEDIOS_PAGO.find(m => m.id === medio);
    if (!elegido) throw new Error("Elige cómo quieres pagar.");
    if (!Number.isInteger(monto) || monto <= 0) throw new Error("El monto a pagar no es válido.");
    if (!referenciaPedido) throw new Error("Falta el código del pedido.");
    if (medio === "transferencia") {
      const error = validarReferenciaTransferencia(referenciaTransferencia);
      if (error) throw new Error(error);
      return { estado: "Pendiente", metodo: elegido.nombre, referencia: "TRF-" + String(referenciaTransferencia).trim().toUpperCase() };
    }
    return { estado: "Pendiente", metodo: elegido.nombre, referencia: "CAJA-" + nuevoUUID().replace(/-/g, "").slice(0, 10).toUpperCase() };
  }
};

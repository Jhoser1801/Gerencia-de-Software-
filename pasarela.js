// Pasarela de pagos de prueba (SCRUM-45). No pide datos de tarjeta ni mueve dinero real.
// Si después usamos una pasarela de verdad, solo hay que cambiar este archivo.

const PasarelaSimulada = {
  nombre: "Pasarela de pagos",
  mediosDePrueba: [
    { id: "aprobada",  etiqueta: "Tarjeta · pago aprobado",  resultado: "Aprobado" },
    { id: "rechazada", etiqueta: "Tarjeta · pago rechazado", resultado: "Rechazado" },
    { id: "pendiente", etiqueta: "Transferencia · pago pendiente", resultado: "Pendiente" }
  ],
  cobrar({ monto, referenciaPedido, medio }) {
    return new Promise((resolver, rechazar) => {
      const elegido = this.mediosDePrueba.find(m => m.id === medio);
      if (!elegido) return rechazar(new Error("Elige un medio de pago."));
      if (!Number.isInteger(monto) || monto <= 0) return rechazar(new Error("El monto a pagar no es válido."));
      if (!referenciaPedido) return rechazar(new Error("Falta el código del pedido."));
      setTimeout(() => resolver({
        estado: elegido.resultado,
        referencia: "SIM-" + nuevoUUID().replace(/-/g, "").slice(0, 12).toUpperCase(),
        metodo: "Simulada: " + elegido.etiqueta
      }), 900);
    });
  }
};

const Pasarela = PasarelaSimulada;

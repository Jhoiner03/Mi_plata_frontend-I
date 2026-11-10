"use strict";

class TarjetaCredito extends Cuenta {
  #cupo;
  constructor(numero, saldo = 0, movimientos = [], cupo = 3000000) {
    // En la tarjeta, el saldo representa la deuda de capital pendiente.
    super(numero, saldo, movimientos);
    this.#cupo = cupo;
  }
  get tipo() {
    return "Crédito";
  }
  get cupo() {
    return this.#cupo;
  }
  get disponible() {
    return redondear(this.#cupo - this.saldo);
  }
  calcularRetiro(valor, numeroCuotas = 1) {
    const monto = validarMonto(valor);
    const cuotas = Number(numeroCuotas);
    if (!Number.isSafeInteger(cuotas) || cuotas < 1 || cuotas > 120) {
      throw new Error("Selecciona entre 1 y 120 cuotas enteras.");
    }
    if (monto > this.disponible)
      throw new Error("La compra supera el cupo disponible.");
    const tasa = cuotas <= 2 ? 0 : cuotas <= 6 ? 0.019 : 0.023;
    const pagoMensual =
      tasa === 0
        ? monto / cuotas
        : (monto * tasa) / (1 - Math.pow(1 + tasa, -cuotas));
    return {
      monto,
      cuotas,
      tasa,
      pagoMensual: redondear(pagoMensual),
      total: redondear(pagoMensual * cuotas),
      saldoFinal: redondear(this.saldo + monto),
    };
  }
  comprar(
    valor,
    cuotas,
    tipo = "Compra",
    detalle = "Compra con tarjeta de crédito",
  ) {
    const resultado = this.calcularRetiro(valor, cuotas);
    this.cambiarSaldo(resultado.saldoFinal);
    this.registrar(
      tipo,
      resultado.monto,
      `${detalle} · ${resultado.cuotas} cuota(s) de ${pesos(resultado.pagoMensual)} · tasa ${(resultado.tasa * 100).toFixed(1)} % mensual`,
      resultado.monto,
    );
    return resultado;
  }
  retirar() {
    throw new Error(
      "Para la tarjeta utiliza Comprar / financiar o Transferir.",
    );
  }
  consignar(
    valor,
    tipo = "Pago de tarjeta",
    detalle = "Abono a la deuda de capital",
  ) {
    const monto = validarMonto(valor);
    if (monto > this.saldo)
      throw new Error("El pago supera la deuda de capital de la tarjeta.");
    this.cambiarSaldo(this.saldo - monto);
    this.registrar(tipo, monto, detalle, -monto);
  }
  enviar(valor, detalle, cuotas = 1) {
    return this.comprar(valor, cuotas, "Transferencia financiada", detalle);
  }
  recibir(valor, detalle) {
    this.consignar(valor, "Transferencia recibida", detalle);
  }
  toJSON() {
    return { ...super.toJSON(), cupo: this.cupo };
  }
}

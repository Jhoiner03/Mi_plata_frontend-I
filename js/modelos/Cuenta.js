"use strict";

class Cuenta {
  #numero;
  #saldo;
  #movimientos;
  constructor(numero, saldo = 0, movimientos = []) {
    this.#numero = numero;
    this.#saldo = saldo;
    this.#movimientos = movimientos.map((movimiento) => ({ ...movimiento }));
  }
  get numero() {
    return this.#numero;
  }
  get saldo() {
    return this.#saldo;
  }
  get movimientos() {
    return this.#movimientos.map((movimiento) => ({ ...movimiento }));
  }
  get disponible() {
    return Math.max(0, this.#saldo);
  }
  get tipo() {
    return "Cuenta";
  }
  registrar(tipo, valor, detalle, impacto) {
    this.#movimientos.push({
      fecha: new Date().toISOString(),
      tipo,
      valor,
      detalle,
      impacto,
    });
  }

  // El saldo solo se modifica por métodos; no tiene setter público.
  cambiarSaldo(valor) {
    if (!Number.isFinite(valor) || Math.abs(valor) > MAX_DINERO) {
      throw new Error("La operación supera el límite de saldo del simulador.");
    }
    this.#saldo = redondear(valor);
  }
  consignar(valor, tipo = "Consignación", detalle = "Depósito de dinero") {
    const monto = validarMonto(valor);
    this.cambiarSaldo(this.saldo + monto);
    this.registrar(tipo, monto, detalle, monto);
  }
  calcularRetiro(valor) {
    const monto = validarMonto(valor);
    if (monto > this.disponible)
      throw new Error("El monto supera el saldo disponible.");
    return { monto, interes: 0, saldoFinal: redondear(this.saldo - monto) };
  }
  retirar(valor) {
    const resultado = this.calcularRetiro(valor);
    this.cambiarSaldo(resultado.saldoFinal);
    this.registrar(
      "Retiro",
      resultado.monto,
      "Retiro de dinero",
      -resultado.monto,
    );
    return resultado;
  }

  // Transferir es distinto de retirar en cajero: no genera rendimiento de ahorros.
  enviar(valor, detalle, cuotas = 1) {
    const monto = validarMonto(valor);
    if (monto > this.disponible)
      throw new Error("Fondos o cupo insuficientes para transferir.");
    this.cambiarSaldo(this.saldo - monto);
    this.registrar("Transferencia enviada", monto, detalle, -monto);
    return { monto, interes: 0, cuotas, pagoMensual: 0 };
  }
  recibir(valor, detalle) {
    this.consignar(valor, "Transferencia recibida", detalle);
  }
  toJSON() {
    return {
      tipo: this.tipo,
      numero: this.numero,
      saldo: this.saldo,
      movimientos: this.movimientos,
    };
  }
}

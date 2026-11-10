"use strict";

class CuentaAhorros extends Cuenta {
  #ultimoInteres;
  constructor(numero, saldo = 0, movimientos = [], ultimoInteres = null) {
    super(numero, saldo, movimientos);
    this.#ultimoInteres = ultimoInteres;
  }
  get tipo() {
    return "Ahorros";
  }
  calcularRetiro(valor) {
    // El monto no puede superar el saldo ANTES del rendimiento, según la guía.
    const calculo = super.calcularRetiro(valor);
    const hoy = new Date();
    const ultimaFecha = this.#ultimoInteres
      ? new Date(this.#ultimoInteres)
      : null;
    // Convención del ejercicio: el primer retiro representa el primer mes.
    // Luego se liquida una vez por mes calendario; repetir retiros el mismo mes
    // no vuelve a generar el 1,5 %. No se aplica interés en operaciones fallidas.
    const meses = ultimaFecha
      ? Math.max(
          0,
          (hoy.getFullYear() - ultimaFecha.getFullYear()) * 12 +
            hoy.getMonth() -
            ultimaFecha.getMonth(),
        )
      : 1;
    const interes = redondear(this.saldo * 0.015 * meses);
    return {
      ...calculo,
      interes,
      meses,
      saldoFinal: redondear(this.saldo + interes - calculo.monto),
    };
  }
  retirar(valor) {
    const resultado = this.calcularRetiro(valor);
    this.cambiarSaldo(resultado.saldoFinal);
    if (resultado.meses > 0) {
      this.#ultimoInteres = new Date().toISOString();
      this.registrar(
        "Interés de ahorros",
        resultado.interes,
        `Rendimiento del 1,5 % mensual · ${resultado.meses} mes(es)`,
        resultado.interes,
      );
    }
    this.registrar(
      "Retiro",
      resultado.monto,
      "Retiro de cuenta de ahorros",
      -resultado.monto,
    );
    return resultado;
  }
  toJSON() {
    return { ...super.toJSON(), ultimoInteres: this.#ultimoInteres };
  }
}

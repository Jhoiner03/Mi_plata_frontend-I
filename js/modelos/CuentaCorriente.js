"use strict";

class CuentaCorriente extends Cuenta {
  get tipo() {
    return "Corriente";
  }

  // Si el saldo ya es negativo, no hay nuevos fondos ni sobregiros disponibles.
  get disponible() {
    return redondear(Math.max(0, this.saldo) * 1.2);
  }
  calcularRetiro(valor) {
    const monto = validarMonto(valor);
    if (monto > this.disponible) {
      throw new Error(
        "El retiro supera el saldo más el 20 % de sobregiro permitido.",
      );
    }
    return { monto, interes: 0, saldoFinal: redondear(this.saldo - monto) };
  }
}

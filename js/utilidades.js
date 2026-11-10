"use strict";

// Formato de moneda, constantes y validaciones compartidas.
const CLAVE_DATOS = "miPlata.datos.v1";
const MAX_DINERO = 1000000000000;
const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;
const pesos = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(valor);

// Escapar texto antes de incorporarlo al HTML evita interpretar datos como etiquetas.
const escapar = (valor) =>
  String(valor ?? "").replace(
    /[&<>"']/g,
    (caracter) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caracter],
  );

function validarMonto(valor) {
  const monto = Number(valor);
  if (
    String(valor).trim() === "" ||
    !Number.isFinite(monto) ||
    monto <= 0 ||
    monto > MAX_DINERO
  ) {
    throw new Error("Ingresa un monto positivo, hasta $1.000.000.000.000.");
  }
  if (Math.abs(monto - redondear(monto)) > 0.000001) {
    throw new Error("El monto admite como máximo dos decimales.");
  }
  return redondear(monto);
}

function validarClave(clave, confirmacion = clave) {
  if (
    typeof clave !== "string" ||
    clave.length < 6 ||
    clave.length > 64 ||
    !clave.trim()
  ) {
    throw new Error("La contraseña debe tener entre 6 y 64 caracteres.");
  }
  if (clave !== confirmacion) throw new Error("Las contraseñas no coinciden.");
}

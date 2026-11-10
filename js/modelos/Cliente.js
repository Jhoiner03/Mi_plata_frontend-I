"use strict";

class Cliente {
  #id;
  #identificacion;
  #nombre;
  #celular;
  #usuario;
  #clave;
  #intentos;
  #productos;
  constructor(datos, productos) {
    this.#id = datos.id;
    this.#identificacion = datos.identificacion;
    this.#nombre = datos.nombre;
    this.#celular = datos.celular;
    this.#usuario = datos.usuario;
    this.#clave = datos.clave;
    this.#intentos = datos.intentos || 0;
    this.#productos = productos;
  }
  get id() {
    return this.#id;
  }
  get identificacion() {
    return this.#identificacion;
  }
  get nombre() {
    return this.#nombre;
  }
  get celular() {
    return this.#celular;
  }
  get usuario() {
    return this.#usuario;
  }
  get intentos() {
    return this.#intentos;
  }
  get bloqueado() {
    return this.#intentos >= 3;
  }
  get productos() {
    return [...this.#productos];
  }
  verificarClave(clave) {
    return this.#clave === clave;
  }
  registrarFallo() {
    this.#intentos = Math.min(3, this.#intentos + 1);
  }
  desbloquear() {
    this.#intentos = 0;
  }
  actualizar(datos) {
    this.#identificacion = datos.identificacion;
    this.#nombre = datos.nombre;
    this.#celular = datos.celular;
    this.#usuario = datos.usuario;
  }
  cambiarClave(actual, nueva) {
    if (!this.verificarClave(actual))
      throw new Error("La contraseña actual es incorrecta.");
    validarClave(nueva);
    this.#clave = nueva;
  }
  toJSON() {
    return {
      id: this.id,
      identificacion: this.identificacion,
      nombre: this.nombre,
      celular: this.celular,
      usuario: this.usuario,
      clave: this.#clave,
      intentos: this.intentos,
      productos: this.productos.map((producto) => producto.toJSON()),
    };
  }
}

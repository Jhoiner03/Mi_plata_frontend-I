"use strict";

// Una meta por cliente. Es una referencia visual: no inmoviliza ni mueve dinero.
class MetasAhorro {
  constructor() {
    this.clave = "miPlata.metas.v1";
    this.metas = {};
    this.errorLectura = false;
    try {
      const guardado = localStorage.getItem(this.clave);
      const datos = guardado ? JSON.parse(guardado) : {};
      if (!datos || typeof datos !== "object" || Array.isArray(datos))
        throw new Error("Formato inválido");
      for (const meta of Object.values(datos)) {
        if (
          !meta ||
          typeof meta.nombre !== "string" ||
          typeof meta.monto !== "number"
        )
          throw new Error("Meta inválida");
        validarMonto(meta.monto);
      }
      this.metas = datos;
    } catch (error) {
      this.errorLectura = true;
    }
  }

  obtener(clienteId) {
    const meta = this.metas[clienteId];
    return meta ? { ...meta } : null;
  }

  guardar(clienteId, nombre, monto) {
    if (this.errorLectura)
      throw new Error(
        "No se pudieron leer tus metas anteriores. Se conservaron los datos existentes.",
      );
    const texto = String(nombre).trim();
    if (texto.length < 3 || texto.length > 45)
      throw new Error(
        "El nombre de tu meta debe tener entre 3 y 45 caracteres.",
      );
    const nuevas = {
      ...this.metas,
      [clienteId]: { nombre: texto, monto: validarMonto(monto) },
    };
    // Solo se actualiza la memoria si se pudo guardar en el navegador.
    localStorage.setItem(this.clave, JSON.stringify(nuevas));
    this.metas = nuevas;
  }

  eliminar(clienteId) {
    if (this.errorLectura)
      throw new Error(
        "Las metas existentes no se pueden modificar hasta corregir su formato.",
      );
    const nuevas = { ...this.metas };
    delete nuevas[clienteId];
    localStorage.setItem(this.clave, JSON.stringify(nuevas));
    this.metas = nuevas;
  }
}

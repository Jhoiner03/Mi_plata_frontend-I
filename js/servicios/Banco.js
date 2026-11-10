"use strict";

class Banco {
  #clientes = [];
  #siguienteNumero = 100001;
  constructor() {
    const guardado = localStorage.getItem(CLAVE_DATOS);
    if (guardado) {
      this.restaurar(JSON.parse(guardado));
    } else {
      this.crearEjemplos();
      this.guardar();
    }
  }
  get clientes() {
    return [...this.#clientes];
  }
  cliente(id) {
    const cliente = this.#clientes.find((item) => item.id === id);
    if (!cliente)
      throw new Error("El usuario ya no existe. Inicia sesión nuevamente.");
    return cliente;
  }
  buscarUsuario(usuario) {
    return this.#clientes.find(
      (item) => item.usuario === String(usuario).trim().toLowerCase(),
    );
  }
  producto(numero) {
    for (const cliente of this.#clientes) {
      const producto = cliente.productos.find((item) => item.numero === numero);
      if (producto) return { cliente, producto };
    }
    throw new Error("No se encontró la cuenta de destino.");
  }
  restaurar(datos) {
    if (
      !Array.isArray(datos.clientes) ||
      !Number.isSafeInteger(datos.siguienteNumero)
    ) {
      throw new Error(
        "Los datos guardados no tienen el formato del simulador.",
      );
    }
    this.#siguienteNumero = datos.siguienteNumero;
    this.#clientes = datos.clientes.map((datosCliente) => {
      const productos = datosCliente.productos.map((datosProducto) => {
        const { tipo, numero, saldo, movimientos, ultimoInteres, cupo } =
          datosProducto;
        if (tipo === "Ahorros")
          return new CuentaAhorros(numero, saldo, movimientos, ultimoInteres);
        if (tipo === "Corriente")
          return new CuentaCorriente(numero, saldo, movimientos);
        if (tipo === "Crédito")
          return new TarjetaCredito(numero, saldo, movimientos, cupo);
        throw new Error("Tipo de producto desconocido en los datos guardados.");
      });
      return new Cliente(datosCliente, productos);
    });
  }
  toJSON() {
    return {
      clientes: this.clientes.map((cliente) => cliente.toJSON()),
      siguienteNumero: this.#siguienteNumero,
    };
  }
  guardar() {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(this.toJSON()));
  }
  // Si una operación o el guardado falla, se restauran ambos productos y sus
  // movimientos. Así una transferencia nunca queda debitada sin ser abonada.
  ejecutar(operacion) {
    const copia = this.toJSON();
    try {
      const resultado = operacion();
      this.guardar();
      return resultado;
    } catch (error) {
      this.restaurar(copia);
      throw error;
    }
  }
  validarDatos(datos, exceptoId = null) {
    const limpios = {
      identificacion: String(datos.identificacion || "")
        .trim()
        .toUpperCase(),
      nombre: String(datos.nombre || "").trim(),
      celular: String(datos.celular || "").trim(),
      usuario: String(datos.usuario || "")
        .trim()
        .toLowerCase(),
    };
    if (!/^[A-Z0-9-]{5,20}$/.test(limpios.identificacion)) {
      throw new Error(
        "La identificación debe tener entre 5 y 20 letras, números o guiones.",
      );
    }
    if (limpios.nombre.length < 3 || limpios.nombre.length > 80) {
      throw new Error("El nombre debe tener entre 3 y 80 caracteres.");
    }
    if (!/^\+?\d{7,15}$/.test(limpios.celular)) {
      throw new Error(
        "El celular debe tener entre 7 y 15 dígitos; admite + al inicio.",
      );
    }
    if (!/^[a-z0-9_.-]{3,24}$/.test(limpios.usuario)) {
      throw new Error(
        "El usuario debe tener de 3 a 24 letras sin tildes, números, puntos, guiones o _.",
      );
    }
    for (const cliente of this.#clientes) {
      if (cliente.id === exceptoId) continue;
      if (cliente.usuario === limpios.usuario)
        throw new Error("Ese nombre de usuario ya está registrado.");
      if (cliente.identificacion === limpios.identificacion)
        throw new Error("Esa identificación ya está registrada.");
    }
    return limpios;
  }
  registrar(datos) {
    const limpios = this.validarDatos(datos);
    validarClave(datos.clave, datos.confirmacion);
    const productos = [
      new CuentaAhorros(String(this.#siguienteNumero++)),
      new CuentaCorriente(String(this.#siguienteNumero++)),
      new TarjetaCredito(String(this.#siguienteNumero++)),
    ];
    const cliente = new Cliente(
      { ...limpios, clave: datos.clave, id: productos[0].numero },
      productos,
    );
    this.#clientes.push(cliente);
    return cliente;
  }
  editar(id, datos) {
    this.cliente(id).actualizar(this.validarDatos(datos, id));
  }
  eliminar(id) {
    const cliente = this.cliente(id);
    if (cliente.productos.some((producto) => producto.saldo !== 0)) {
      throw new Error(
        "Para eliminar un usuario, sus cuentas deben estar en cero y su tarjeta sin deuda.",
      );
    }
    this.#clientes = this.#clientes.filter((item) => item.id !== id);
  }
  autenticar(usuario, clave) {
    const cliente = this.buscarUsuario(usuario);
    if (!cliente)
      return { error: "Usuario o contraseña incorrectos.", intentos: null };
    if (cliente.bloqueado)
      return {
        error:
          "Cuenta bloqueada tras 3 intentos. Solicita el desbloqueo en Usuarios (simulación).",
        intentos: 3,
      };
    if (!cliente.verificarClave(clave)) {
      cliente.registrarFallo();
      return {
        error: cliente.bloqueado
          ? "Tercer intento fallido. La cuenta quedó bloqueada."
          : `Usuario o contraseña incorrectos. Quedan ${3 - cliente.intentos} intento(s).`,
        intentos: cliente.intentos,
      };
    }
    cliente.desbloquear();
    return { cliente };
  }
  transferir(clienteId, origenNumero, destinoNumero, valor, cuotas) {
    const origen = this.cliente(clienteId).productos.find(
      (producto) => producto.numero === origenNumero,
    );
    if (!origen) throw new Error("Selecciona un producto de origen propio.");
    if (origenNumero === destinoNumero)
      throw new Error("No puedes transferir al mismo producto.");
    const { cliente: receptor, producto: destino } =
      this.producto(destinoNumero);
    const monto = validarMonto(valor);
    // Una transferencia a tarjeta se interpreta como pago de su deuda.
    if (destino instanceof TarjetaCredito && monto > destino.saldo) {
      throw new Error(
        "El destino es una tarjeta: el abono no puede superar su deuda de capital.",
      );
    }
    const resultado = origen.enviar(
      monto,
      `A ${receptor.nombre} · ${destino.tipo} ${destino.numero}`,
      cuotas,
    );
    destino.recibir(
      monto,
      `De ${this.cliente(clienteId).nombre} · ${origen.tipo} ${origen.numero}`,
    );
    return resultado;
  }
  crearEjemplos() {
    const ana = this.registrar({
      identificacion: "1001001001",
      nombre: "Ana Martínez",
      celular: "3001234567",
      usuario: "ana",
      clave: "Ana123",
      confirmacion: "Ana123",
    });
    this.registrar({
      identificacion: "1001001002",
      nombre: "Luis Ramírez",
      celular: "3007654321",
      usuario: "luis",
      clave: "Luis123",
      confirmacion: "Luis123",
    });
    ana.productos[0].consignar(
      1000000,
      "Consignación",
      "Saldo inicial de demostración",
    );
    ana.productos[1].consignar(
      500000,
      "Consignación",
      "Saldo inicial de demostración",
    );
  }
}

// La interfaz se encarga del DOM; las reglas de negocio están en las clases.

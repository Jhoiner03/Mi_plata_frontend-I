"use strict";

/* MI PLATA - Frontend 1
 * Abrir index.html directamente o con Live Server. No requiere instalación.
 * Datos de prueba: ana / Ana123 y luis / Luis123.
 * Se guardan datos en este navegador usando localStorage. Es una simulación:
 * las claves locales NO constituyen autenticación segura para un banco real.
 *
 * POO: Cliente y Cuenta abstraen entidades; # protege los atributos internos;
 * las tres clases de productos heredan de Cuenta y redefinen calcularRetiro.
 */
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
class Aplicacion {
  constructor(banco) {
    this.banco = banco;
    this.sesion = null;
    this.seleccionado = null;
    this.pagina = "inicio";
    this.seccion = "saldo";
    this.editorId = null;
    this.recibo = null;
    this.contenido = document.getElementById("contenido");
    document.addEventListener("click", (evento) => this.alHacerClic(evento));
    document.addEventListener("submit", (evento) => this.alEnviar(evento));
    document.addEventListener("input", (evento) => this.alCambiar(evento));
    document.addEventListener("change", (evento) => this.alCambiar(evento));
    window.addEventListener("hashchange", () => this.ruta());
    // Evita trabajar con saldos antiguos si otra pestaña modifica los datos.
    window.addEventListener("storage", (evento) => {
      if (evento.key === CLAVE_DATOS) window.location.reload();
    });
    this.ruta();
  }
  avisar(texto, tipo = "success") {
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.className = `notice ${tipo}`;
    mensaje.hidden = false;
    mensaje.setAttribute("role", tipo === "error" ? "alert" : "status");
  }
  limpiarAviso() {
    document.getElementById("mensaje").hidden = true;
  }
  ir(pagina) {
    if (location.hash === `#${pagina}`) this.ruta();
    else location.hash = pagina;
  }
  ruta() {
    this.limpiarAviso();
    const ruta = location.hash.slice(1) || "inicio";
    this.pagina = ["inicio", "registro", "login", "panel"].includes(ruta)
      ? ruta
      : "inicio";
    if (this.pagina === "panel" && !this.sesion) this.pagina = "login";
    if (this.sesion && ["registro", "login"].includes(this.pagina))
      this.pagina = "panel";
    this.renderizar();
  }
  renderizar() {
    document.getElementById("navegacion").innerHTML = this.sesion
      ? '<a href="#panel" class="button secondary">Mi panel</a><button class="outline" data-accion="salir">Cerrar sesión</button>'
      : '<a href="#login">Iniciar sesión</a><a class="button" href="#registro">Registrarse ↗</a>';
    if (this.pagina === "inicio") this.contenido.innerHTML = this.inicioHTML();
    if (this.pagina === "registro")
      this.contenido.innerHTML = this.registroHTML();
    if (this.pagina === "login") this.contenido.innerHTML = this.loginHTML();
    if (this.pagina === "panel") this.contenido.innerHTML = this.panelHTML();
  }
  inicioHTML() {
    return /* HTML */ `<section class="hero">
        <div>
          <div class="eyebrow">BIENVENIDO A MI PLATA</div>
          <h1>Grandes planes.<br />Tu plata, contigo.</h1>
          <p>
            Ahorra, mueve tu dinero y financia tus ideas desde un solo lugar.
            Una experiencia sencilla para dar tu siguiente paso.
          </p>
          <div class="actions">
            <a class="button" href="#registro">Abre tu cuenta ↗</a
            ><a class="button outline" href="#login">Ya soy cliente</a>
          </div>
          <p class="help">Sin filas. Sin complicaciones. Todo a tu ritmo.</p>
        </div>
        <div
          class="hero-art"
          aria-label="Ilustración de tarjeta bancaria Mi Plata"
        >
          <div class="bank-card">
            <div class="card-mark">mi plata.</div>
            <div class="chip"></div>
            <div class="card-number">
              •••• &nbsp; •••• &nbsp; •••• &nbsp; 2026
            </div>
            <div class="card-bottom">
              <span>CONTIGO EN CADA PASO</span><span>MI PLATA</span>
            </div>
          </div>
          <div class="floating-note">
            <strong>Un lugar para tus metas ↗</strong>Ahorros · Corriente ·
            Crédito
          </div>
        </div>
      </section>
      <section>
        <div class="section-heading">
          <div>
            <div class="eyebrow">TRES FORMAS DE AVANZAR</div>
            <h2>Una cuenta para cada plan.</h2>
          </div>
        </div>
        <div class="grid-three">
          <article class="feature">
            <span class="number">01 / AHORRA</span>
            <h3>Cuenta de ahorros</h3>
            <p>
              Haz crecer tus metas con un rendimiento del 1,5 % mensual,
              liquidado al retirar.
            </p>
          </article>
          <article class="feature">
            <span class="number">02 / MUEVE</span>
            <h3>Cuenta corriente</h3>
            <p>
              Tu dinero para el día a día, con hasta un 20 % de sobregiro sobre
              tu saldo positivo.
            </p>
          </article>
          <article class="feature">
            <span class="number">03 / PROYECTA</span>
            <h3>Tarjeta de crédito</h3>
            <p>
              Cupo simulado de $3.000.000 y compras a una o dos cuotas sin
              intereses.
            </p>
          </article>
        </div>
      </section>`;
  }
  camposCliente(cliente = null) {
    return /* HTML */ `<div class="form-grid">
        <div class="field">
          <label for="identificacion">Cédula o pasaporte</label
          ><input
            id="identificacion"
            name="identificacion"
            value="${escapar(cliente?.identificacion || "")}"
            minlength="5"
            maxlength="20"
            required
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="nombre">Nombre completo</label
          ><input
            id="nombre"
            name="nombre"
            value="${escapar(cliente?.nombre || "")}"
            minlength="3"
            maxlength="80"
            required
            autocomplete="name"
          />
        </div>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="celular">Celular</label
          ><input
            id="celular"
            name="celular"
            type="tel"
            value="${escapar(cliente?.celular || "")}"
            maxlength="16"
            required
            autocomplete="tel"
            placeholder="3001234567"
          />
        </div>
        <div class="field">
          <label for="usuario">Nombre de usuario</label
          ><input
            id="usuario"
            name="usuario"
            value="${escapar(cliente?.usuario || "")}"
            minlength="3"
            maxlength="24"
            required
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
          />
        </div>
      </div>`;
  }
  camposClave() {
    return /* HTML */ `<div class="form-grid">
        <div class="field">
          <label for="clave">Contraseña</label
          ><input
            id="clave"
            name="clave"
            type="password"
            minlength="6"
            maxlength="64"
            required
            autocomplete="new-password"
          />
        </div>
        <div class="field">
          <label for="confirmacion">Confirmar contraseña</label
          ><input
            id="confirmacion"
            name="confirmacion"
            type="password"
            minlength="6"
            maxlength="64"
            required
            autocomplete="new-password"
          />
        </div>
      </div>
      <p class="help">
        Usa entre 6 y 64 caracteres. Solo contraseñas ficticias para este
        ejercicio.
      </p>`;
  }
  registroHTML() {
    return /* HTML */ `<section class="auth">
      <div class="eyebrow">TU SIGUIENTE PASO</div>
      <div class="panel">
        <h1>Hagamos espacio<br />para tus metas.</h1>
        <p>Regístrate y recibe tus tres productos de prueba.</p>
        <form id="registro">
          ${this.camposCliente()}${this.camposClave()}<button
            class="full-width"
            type="submit"
          >
            Crear cuenta ↗
          </button>
        </form>
        <p class="help">
          ¿Ya tienes cuenta? <a href="#login">Inicia sesión</a>
        </p>
      </div>
    </section>`;
  }
  loginHTML() {
    return /* HTML */ `<section class="auth">
      <div class="eyebrow">QUÉ BUENO TENERTE AQUÍ</div>
      <div class="panel">
        <h1>Hola de nuevo.</h1>
        <p>Entra para consultar y mover tu plata.</p>
        <form id="login">
          <div class="field">
            <label for="login-usuario">Usuario</label
            ><input
              id="login-usuario"
              name="usuario"
              required
              maxlength="24"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
            />
          </div>
          <div class="field">
            <label for="login-clave">Contraseña</label
            ><input
              id="login-clave"
              name="clave"
              type="password"
              required
              maxlength="64"
              autocomplete="current-password"
            />
          </div>
          <div class="attempts" id="intentos" aria-live="polite">
            Intentos fallidos: 0 de 3. La cuenta se bloquea al tercero.
          </div>
          <button class="full-width" type="submit">Entrar a mi cuenta ↗</button>
        </form>
        <div class="help">
          <strong>Usuarios de demostración</strong><br />ana / Ana123 · luis /
          Luis123<br />Los datos se conservan en este navegador. La sesión se
          cierra al recargar.
        </div>
        <p class="help">
          ¿Tu primera vez aquí? <a href="#registro">Regístrate</a>
        </p>
      </div>
    </section>`;
  }
  get clienteActual() {
    return this.banco.cliente(this.sesion);
  }
  get productoActual() {
    return (
      this.clienteActual.productos.find(
        (producto) => producto.numero === this.seleccionado,
      ) || this.clienteActual.productos[0]
    );
  }
  panelHTML() {
    const cliente = this.clienteActual;
    const producto = this.productoActual;
    this.seleccionado = producto.numero;
    const opciones = [
      ["saldo", "Consultar saldo"],
      ["consignar", "Consignar / pagar"],
      ["retirar", "Retirar dinero"],
      ["comprar", "Comprar / financiar"],
      ["transferir", "Transferir"],
      ["movimientos", "Movimientos"],
      ["perfil", "Perfil"],
      ["usuarios", "Usuarios"],
    ];
    return /* HTML */ `<section>
      <div class="section-heading">
        <div>
          <div class="eyebrow">TU SUCURSAL DIGITAL</div>
          <h1>Hola, ${escapar(cliente.nombre.split(" ")[0])}.</h1>
          <p>Este es el resumen de tu plata. ¿Qué hacemos hoy?</p>
        </div>
        <span class="badge">Sesión iniciada · ${escapar(cliente.usuario)}</span>
      </div>
      <div class="grid-three">
        ${cliente.productos.map((cuenta) => /* HTML */ `<article class="product ${cuenta.numero === producto.numero ? "selected" : ""}"><span class="product-label">${escapar(cuenta.tipo)}</span><span class="product-number">N.º ${cuenta.numero}</span><small>${cuenta instanceof TarjetaCredito ? "Cupo disponible" : "Saldo actual"}</small><span class="amount">${pesos(cuenta instanceof TarjetaCredito ? cuenta.disponible : cuenta.saldo)}</span><button class="secondary small-button" data-producto="${cuenta.numero}" aria-pressed="${cuenta.numero === producto.numero}">${cuenta.numero === producto.numero ? "Seleccionado ✓" : "Seleccionar"}</button></article>`).join("")}
      </div>
      <nav class="dashboard-nav" aria-label="Operaciones del cajero">
        ${opciones.map(([id, texto]) => /* HTML */ `<button data-seccion="${id}" class="${this.seccion === id ? "active" : ""}" ${this.seccion === id ? 'aria-current="page"' : ""}>${texto}</button>`).join("")}
      </nav>
      ${this.seccionHTML(producto)}
    </section>`;
  }
  resumenHTML(producto) {
    const tarjeta = producto instanceof TarjetaCredito;
    return /* HTML */ `<aside class="summary">
      <div class="eyebrow">PRODUCTO SELECCIONADO</div>
      <h3>${producto.tipo} · ${producto.numero}</h3>
      <dl>
        <dt>${tarjeta ? "Deuda de capital" : "Saldo actual"}</dt>
        <dd>${pesos(producto.saldo)}</dd>
        <dt>${tarjeta ? "Cupo disponible" : "Disponible para retirar"}</dt>
        <dd>${pesos(producto.disponible)}</dd>
        ${
          tarjeta
            ? /* HTML */ `<dt>Cupo total</dt>
                <dd>${pesos(producto.cupo)}</dd>`
            : ""
        }
      </dl>
      <hr />
      <p>
        ${producto instanceof CuentaAhorros ? "Rendimiento del 1,5 % mensual liquidado al retirar. El primer retiro simula el primer mes; luego se liquida una vez por mes calendario. El retiro se valida contra el saldo previo al interés." : tarjeta ? "1–2 cuotas: 0 %. De 3 a 6: 1,9 % mensual. Desde 7: 2,3 % mensual. Las cuotas usan la fórmula de anualidad del documento." : "No genera intereses. Puedes retirar hasta el 120 % de tu saldo positivo. Si quedas en sobregiro, debes consignar antes de volver a retirar."}
      </p>
      ${tarjeta ? "<p>Los abonos reducen el capital y liberan cupo. Las cuotas son una simulación informativa; no hay calendario de cobros ni liquidación de pagos mensuales.</p>" : ""}
      <p>Moneda: pesos colombianos (COP).</p>
    </aside>`;
  }
  montoHTML(etiqueta = "Monto en pesos colombianos") {
    return /* HTML */ `<div class="field">
      <label for="monto">${etiqueta}</label
      ><input
        id="monto"
        name="monto"
        type="number"
        min="0.01"
        max="${MAX_DINERO}"
        step="0.01"
        required
        placeholder="Ej. 50000"
        inputmode="decimal"
      />
    </div>`;
  }
  cuotasHTML() {
    return '<div class="field"><label for="cuotas">Número de cuotas</label><input id="cuotas" name="cuotas" type="number" min="1" max="120" step="1" value="1" required><small>1–2: sin interés · 3–6: 1,9 % · 7–120: 2,3 % mensual.</small></div><div id="cotizacion" class="attempts" aria-live="polite">Ingresa un monto para consultar tu cuota mensual.</div>';
  }
  seccionHTML(producto) {
    if (this.seccion === "usuarios") return this.usuariosHTML();
    if (this.seccion === "perfil") return this.perfilHTML();
    if (this.seccion === "movimientos") return this.movimientosHTML(producto);
    let contenido = "";
    if (this.seccion === "saldo") {
      contenido = /* HTML */ `<h2>Tu plata, a la vista.</h2>
        <p class="muted">
          Consulta otro producto seleccionando su tarjeta de arriba.
        </p>
        <div class="eyebrow">
          ${producto instanceof TarjetaCredito ? "CUPO DISPONIBLE" : "SALDO ACTUAL"}
        </div>
        <h2>
          ${pesos(producto instanceof TarjetaCredito ? producto.disponible : producto.saldo)}
        </h2>
        <p>Producto: ${producto.tipo} · N.º ${producto.numero}</p>
        <div class="actions">
          <button
            data-seccion="${producto instanceof TarjetaCredito ? "comprar" : "consignar"}"
          >
            ${producto instanceof TarjetaCredito ? "Hacer una compra" : "Consignar dinero"}
            ↗</button
          ><button class="secondary" data-seccion="movimientos">
            Ver movimientos
          </button>
        </div>`;
    }
    if (this.seccion === "consignar") {
      const tarjeta = producto instanceof TarjetaCredito;
      contenido = /* HTML */ `<h2>
          ${tarjeta ? "Pagar tarjeta" : "Consignar dinero"}
        </h2>
        <p class="muted">
          ${tarjeta ? "Abona a tu deuda de capital y recupera cupo disponible." : "Tu saldo se actualizará al confirmar la consignación."}
        </p>
        <form id="consignar">
          ${this.montoHTML()}<button type="submit">
            ${tarjeta ? "Confirmar pago" : "Confirmar consignación"} ↗
          </button>
        </form>`;
    }
    if (this.seccion === "retirar") {
      contenido =
        producto instanceof TarjetaCredito
          ? '<h2>Esta es tu tarjeta de crédito.</h2><p>Utiliza la opción Comprar / financiar para elegir tus cuotas.</p><button data-seccion="comprar">Ir a compras ↗</button>'
          : /* HTML */ `<h2>Retirar dinero</h2>
              <p class="muted">
                Disponible para retirar: ${pesos(producto.disponible)}.
              </p>
              <form id="retirar">
                ${this.montoHTML()}<button type="submit">
                  Confirmar retiro ↗
                </button>
              </form>`;
    }
    if (this.seccion === "comprar") {
      contenido =
        producto instanceof TarjetaCredito
          ? /* HTML */ `<h2>Un plan para tu compra.</h2>
              <p class="muted">
                Elige las cuotas y consulta el pago mensual antes de confirmar.
              </p>
              <form id="comprar">
                ${this.montoHTML("Valor de la compra en COP")}${this.cuotasHTML()}<button
                  type="submit"
                >
                  Confirmar compra ↗
                </button>
              </form>`
          : '<h2>Selecciona tu tarjeta de crédito.</h2><p>Las compras a cuotas están disponibles en el producto Crédito.</p><button data-accion="seleccionar-credito">Seleccionar crédito ↗</button>';
    }
    if (this.seccion === "transferir") {
      const destinos = this.banco.clientes
        .map((cliente) => {
          const cuentas = cliente.productos.filter(
            (cuenta) => cuenta.numero !== producto.numero,
          );
          return /* HTML */ `<optgroup
            label="${escapar(cliente.id === this.sesion ? "Mis productos" : cliente.nombre)}"
          >
            ${cuentas.map((cuenta) => /* HTML */ `<option value="${cuenta.numero}">${escapar(cliente.usuario)} · ${cuenta.tipo} · ${cuenta.numero}${cuenta instanceof TarjetaCredito ? " (pago de deuda)" : ""}</option>`).join("")}
          </optgroup>`;
        })
        .join("");
      contenido = /* HTML */ `<h2>Que tu plata se mueva.</h2>
        <p class="muted">
          Transfiere a otro producto tuyo o a otro cliente del simulador.
        </p>
        <form id="transferir">
          <div class="field">
            <label for="destino">Cuenta o producto de destino</label
            ><select id="destino" name="destino" required>
              <option value="">Selecciona el destino</option>
              ${destinos}</select
            ><small
              >Las transferencias a tarjetas abonan su deuda de capital.</small
            >
          </div>
          ${this.montoHTML()}${producto instanceof TarjetaCredito ? this.cuotasHTML() : ""}<button
            type="submit"
          >
            Confirmar transferencia ↗
          </button>
        </form>`;
    }
    return /* HTML */ `<div class="transaction-layout">
      <section class="panel">
        ${contenido}${this.recibo ? /* HTML */ `<div class="receipt" role="status">${escapar(this.recibo)}</div>` : ""}
      </section>
      ${this.resumenHTML(producto)}
    </div>`;
  }
  movimientosHTML(producto) {
    // reverse conserva primero el último movimiento incluso con la misma fecha.
    const movimientos = producto.movimientos
      .reverse()
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return /* HTML */ `<section class="panel">
      <div class="section-heading">
        <div>
          <h2>Tu historial, en orden.</h2>
          <p>${producto.tipo} · ${producto.numero} · Más reciente primero.</p>
        </div>
        <span class="badge">${movimientos.length} movimiento(s)</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Operación</th>
              <th>Valor</th>
              <th>
                Impacto en
                ${producto instanceof TarjetaCredito ? "deuda" : "saldo"}
              </th>
            </tr>
          </thead>
          <tbody>
            ${
              movimientos.length
                ? movimientos
                    .map(
                      (movimiento) =>
                        /* HTML */ `<tr>
                          <td>
                            ${escapar(new Date(movimiento.fecha).toLocaleString("es-CO"))}
                          </td>
                          <td>
                            ${escapar(movimiento.tipo)}<small
                              >${escapar(movimiento.detalle)}</small
                            >
                          </td>
                          <td class="money">${pesos(movimiento.valor)}</td>
                          <td
                            class="money ${movimiento.impacto < 0 ? "negative" : "positive"}"
                          >
                            ${movimiento.impacto > 0 ? "+" : ""}${pesos(movimiento.impacto)}
                          </td>
                        </tr>`,
                    )
                    .join("")
                : '<tr><td colspan="4" class="empty">Todavía no tienes movimientos en este producto.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>`;
  }
  perfilHTML() {
    return /* HTML */ `<div class="two-panels">
      <section class="panel">
        <h2>Tu perfil</h2>
        <p class="muted">Mantén tus datos al día.</p>
        <form id="perfil">
          ${this.camposCliente(this.clienteActual)}<button type="submit">
            Guardar datos ↗
          </button>
        </form>
      </section>
      <section class="panel">
        <h2>Cambiar contraseña</h2>
        <form id="cambiar-clave">
          <div class="field">
            <label for="usuario-seguridad">Confirma tu usuario</label
            ><input
              id="usuario-seguridad"
              name="usuario"
              required
              autocomplete="username"
            />
          </div>
          <div class="field">
            <label for="clave-actual">Contraseña actual</label
            ><input
              id="clave-actual"
              name="actual"
              type="password"
              required
              autocomplete="current-password"
            />
          </div>
          <div class="field">
            <label for="clave-nueva">Nueva contraseña</label
            ><input
              id="clave-nueva"
              name="nueva"
              type="password"
              minlength="6"
              maxlength="64"
              required
              autocomplete="new-password"
            />
          </div>
          <div class="field">
            <label for="clave-confirmada">Confirmar nueva contraseña</label
            ><input
              id="clave-confirmada"
              name="confirmacion"
              type="password"
              minlength="6"
              maxlength="64"
              required
              autocomplete="new-password"
            />
          </div>
          <button type="submit">Actualizar contraseña ↗</button>
        </form>
      </section>
    </div>`;
  }
  usuariosHTML() {
    const editado = this.editorId ? this.banco.cliente(this.editorId) : null;
    return /* HTML */ `<section class="panel">
        <div class="section-heading">
          <div>
            <h2>Administrar usuarios</h2>
            <p>
              CRUD académico disponible para todos los clientes del simulador.
            </p>
          </div>
          <button class="secondary" data-accion="nuevo-usuario">
            Agregar usuario +
          </button>
        </div>
        <p class="help">
          En este ejercicio no hay roles de administrador. Solo se eliminan
          usuarios sin dinero ni deuda. El desbloqueo es manual para demostrar
          el límite de intentos.
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Usuario / celular</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${this.banco.clientes
                .map(
                  (cliente) =>
                    /* HTML */ `<tr>
                      <td>
                        ${escapar(cliente.nombre)}<small
                          >ID: ${escapar(cliente.identificacion)}</small
                        >
                      </td>
                      <td>
                        ${escapar(cliente.usuario)}<small
                          >${escapar(cliente.celular)}</small
                        >
                      </td>
                      <td>
                        <span
                          class="badge ${cliente.bloqueado ? "blocked" : ""}"
                          >${cliente.bloqueado ? "Bloqueado" : "Activo"}</span
                        ><small>${cliente.intentos}/3 intentos fallidos</small>
                      </td>
                      <td>
                        <div class="user-actions">
                          <button
                            class="secondary small-button"
                            data-editar="${cliente.id}"
                          >
                            Editar</button
                          >${cliente.bloqueado ? /* HTML */ `<button class="outline small-button" data-desbloquear="${cliente.id}">Desbloquear</button>` : ""}<button
                            class="danger small-button"
                            data-eliminar="${cliente.id}"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel top-space" id="editor-usuario">
        <h2>${editado ? "Editar usuario" : "Agregar usuario"}</h2>
        <form id="usuario-admin">
          ${this.camposCliente(editado)}${editado ? '<p class="help">La contraseña se cambia desde el perfil, verificando la clave actual.</p>' : this.camposClave()}
          <div class="actions">
            <button type="submit">
              ${editado ? "Guardar cambios" : "Crear usuario"} ↗</button
            >${editado ? '<button type="button" class="outline" data-accion="nuevo-usuario">Cancelar edición</button>' : ""}
          </div>
        </form>
      </section>`;
  }
  actualizarIntentos() {
    const campo = document.getElementById("login-usuario");
    const indicador = document.getElementById("intentos");
    if (!campo || !indicador) return;
    const cliente = this.banco.buscarUsuario(campo.value);
    indicador.textContent = `Intentos fallidos: ${cliente?.intentos || 0} de 3. ${cliente?.bloqueado ? "Cuenta bloqueada." : "La cuenta se bloquea al tercero."}`;
  }
  alCambiar(evento) {
    if (evento.target.id === "login-usuario") this.actualizarIntentos();
    if (!["monto", "cuotas"].includes(evento.target.id) || !this.sesion) return;
    const cotizacion = document.getElementById("cotizacion");
    if (!cotizacion) return;
    const monto = document.getElementById("monto").value;
    const cuotas = document.getElementById("cuotas").value;
    try {
      const resultado = this.productoActual.calcularRetiro(monto, cuotas);
      cotizacion.textContent = `${resultado.cuotas} cuota(s) de ${pesos(resultado.pagoMensual)} · ${(resultado.tasa * 100).toFixed(1)} % mensual · Total estimado: ${pesos(resultado.total)}. La última cuota puede variar por redondeo.`;
    } catch (error) {
      cotizacion.textContent = monto
        ? error.message
        : "Ingresa un monto para consultar tu cuota mensual.";
    }
  }
  alHacerClic(evento) {
    const boton = evento.target.closest("button");
    if (!boton) return;
    try {
      if (boton.dataset.accion === "salir") {
        this.sesion = null;
        this.seleccionado = null;
        this.recibo = null;
        this.editorId = null;
        this.ir("login");
        return;
      }
      if (!this.sesion) return;
      if (boton.dataset.seccion) {
        this.seccion = boton.dataset.seccion;
        this.recibo = null;
        this.editorId = null;
        this.limpiarAviso();
        this.renderizar();
      }
      if (
        boton.dataset.producto ||
        boton.dataset.accion === "seleccionar-credito"
      ) {
        this.seleccionado =
          boton.dataset.producto || this.clienteActual.productos[2].numero;
        this.recibo = null;
        this.limpiarAviso();
        this.renderizar();
      }
      if (boton.dataset.editar || boton.dataset.accion === "nuevo-usuario") {
        this.editorId = boton.dataset.editar || null;
        this.limpiarAviso();
        this.renderizar();
        document
          .getElementById("editor-usuario")
          .scrollIntoView({ block: "start" });
        document
          .getElementById("identificacion")
          .focus({ preventScroll: true });
      }
      if (boton.dataset.desbloquear) {
        this.banco.ejecutar(() =>
          this.banco.cliente(boton.dataset.desbloquear).desbloquear(),
        );
        this.renderizar();
        this.avisar("Usuario desbloqueado. Intentos reiniciados a 0 de 3.");
      }
      if (boton.dataset.eliminar) {
        const id = boton.dataset.eliminar;
        const cliente = this.banco.cliente(id);
        if (
          !window.confirm(
            `¿Eliminar a ${cliente.nombre} y todos sus productos? Esta acción no se puede deshacer.`,
          )
        )
          return;
        this.banco.ejecutar(() => this.banco.eliminar(id));
        if (this.editorId === id) this.editorId = null;
        if (this.sesion === id) {
          this.sesion = null;
          this.seleccionado = null;
          this.pagina = "login";
          history.replaceState(null, "", "#login");
        }
        this.renderizar();
        this.avisar("Usuario eliminado correctamente.");
      }
    } catch (error) {
      this.avisar(error.message, "error");
    }
  }
  alEnviar(evento) {
    if (!(evento.target instanceof HTMLFormElement)) return;
    evento.preventDefault();
    if (!evento.target.reportValidity()) return;
    const formulario = evento.target;
    const datos = Object.fromEntries(new FormData(formulario));
    this.limpiarAviso();
    try {
      if (formulario.id === "registro") {
        this.banco.ejecutar(() => this.banco.registrar(datos));
        this.pagina = "login";
        history.replaceState(null, "", "#login");
        this.renderizar();
        this.avisar(
          "Registro exitoso. Tus cuentas inician en $0 y tu tarjeta tiene $3.000.000 de cupo. Inicia sesión.",
        );
        return;
      }
      if (formulario.id === "login") {
        const resultado = this.banco.ejecutar(() =>
          this.banco.autenticar(datos.usuario, datos.clave),
        );
        this.actualizarIntentos();
        if (resultado.error) {
          document.getElementById("login-clave").value = "";
          this.avisar(resultado.error, "error");
          return;
        }
        this.sesion = resultado.cliente.id;
        this.seleccionado = resultado.cliente.productos[0].numero;
        this.seccion = "saldo";
        this.recibo = null;
        this.editorId = null;
        this.pagina = "panel";
        history.replaceState(null, "", "#panel");
        this.renderizar();
        this.avisar("Sesión iniciada. Bienvenido a Mi Plata.");
        return;
      }
      if (!this.sesion)
        throw new Error("Inicia sesión para realizar esta operación.");
      let mensaje = "";
      this.recibo = null;
      if (formulario.id === "perfil") {
        this.banco.ejecutar(() => this.banco.editar(this.sesion, datos));
        mensaje = "Perfil actualizado correctamente.";
      }
      if (formulario.id === "cambiar-clave") {
        if (datos.usuario.trim().toLowerCase() !== this.clienteActual.usuario)
          throw new Error("El usuario no corresponde a tu sesión.");
        validarClave(datos.nueva, datos.confirmacion);
        this.banco.ejecutar(() =>
          this.clienteActual.cambiarClave(datos.actual, datos.nueva),
        );
        mensaje =
          "Contraseña actualizada correctamente. Úsala en tu próximo inicio de sesión.";
      }
      if (formulario.id === "usuario-admin") {
        this.banco.ejecutar(() =>
          this.editorId
            ? this.banco.editar(this.editorId, datos)
            : this.banco.registrar(datos),
        );
        mensaje = this.editorId
          ? "Usuario actualizado correctamente."
          : "Usuario creado con sus tres productos.";
        this.editorId = null;
      }
      if (formulario.id === "consignar") {
        this.banco.ejecutar(() => this.productoActual.consignar(datos.monto));
        mensaje =
          this.productoActual instanceof TarjetaCredito
            ? `Pago realizado. Deuda de capital: ${pesos(this.productoActual.saldo)}.`
            : `Consignación exitosa. Nuevo saldo: ${pesos(this.productoActual.saldo)}.`;
      }
      if (formulario.id === "retirar") {
        const resultado = this.banco.ejecutar(() =>
          this.productoActual.retirar(datos.monto),
        );
        mensaje = `Retiraste ${pesos(resultado.monto)}. Rendimiento abonado: ${pesos(resultado.interes)}. Nuevo saldo: ${pesos(this.productoActual.saldo)}.`;
      }
      if (formulario.id === "comprar") {
        if (!(this.productoActual instanceof TarjetaCredito))
          throw new Error("Selecciona la tarjeta de crédito.");
        const resultado = this.banco.ejecutar(() =>
          this.productoActual.comprar(datos.monto, datos.cuotas),
        );
        mensaje =
          "Compra aprobada. Tu cupo y tus movimientos fueron actualizados.";
        this.recibo = this.textoRecibo(resultado);
      }
      if (formulario.id === "transferir") {
        const resultado = this.banco.ejecutar(() =>
          this.banco.transferir(
            this.sesion,
            this.seleccionado,
            datos.destino,
            datos.monto,
            datos.cuotas,
          ),
        );
        mensaje = `Transferencia exitosa de ${pesos(resultado.monto)} al producto ${datos.destino}. Ambos movimientos quedaron registrados.`;
        if (this.productoActual instanceof TarjetaCredito)
          this.recibo = this.textoRecibo(resultado);
      }
      this.renderizar();
      this.avisar(mensaje);
    } catch (error) {
      this.avisar(error.message, "error");
    }
  }
  textoRecibo(resultado) {
    return `${resultado.cuotas} cuota(s) de ${pesos(resultado.pagoMensual)}. Tasa mensual: ${(resultado.tasa * 100).toFixed(1)} %. Total estimado a pagar: ${pesos(resultado.total)}. Cupo restante: ${pesos(this.productoActual.disponible)}. La última cuota puede variar por redondeo.`;
  }
}

// No se borra automáticamente la información si el navegador rechaza el acceso
// al almacenamiento o si los datos guardados están dañados.
if (typeof document !== "undefined") {
  try {
    new Aplicacion(new Banco());
  } catch (error) {
    document.getElementById("contenido").innerHTML =
      '<section class="panel"><h1>No pudimos abrir el simulador.</h1><p>Comprueba que el navegador permita guardar datos locales. También puedes abrir el proyecto con Live Server en Visual Studio Code.</p></section>';
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = `No se modificaron los datos existentes. Detalle: ${error.message}`;
    mensaje.className = "notice error";
    mensaje.hidden = false;
  }
}

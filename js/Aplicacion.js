"use strict";

// Coordina las vistas y mantiene el estado de la sesión.
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
    this.temporizadorAviso = null;
    this.intervaloAviso = null;
    this.metas = new MetasAhorro();
    this.animaciones = new Animaciones();
    this.vistaMetas = new VistaMetas(this);
    this.formularios = new Formularios();
    this.vistaAcceso = new VistaAcceso(this);
    this.vistaPanel = new VistaPanel(this);
    this.vistaProductos = new VistaProductos(this);
    this.vistaUsuarios = new VistaUsuarios(this);
    this.eventos = new Eventos(this);
    this.eventos.escuchar();
    this.ruta();
  }

  avisar(texto, tipo = "success") {
    this.limpiarAviso();
    const mensaje = document.getElementById("mensaje");
    mensaje.className = `notice ${tipo}`;
    mensaje.setAttribute("role", tipo === "error" ? "alert" : "status");
    // La barra y el contador hacen visible el paso del tiempo en la interfaz.
    mensaje.innerHTML = `<span class="notice-icon" aria-hidden="true">${tipo === "error" ? "!" : "✓"}</span>
      <div class="notice-content"><strong>${tipo === "error" ? "Revisa la información" : "Todo listo"}</strong>
      <span>${escapar(texto)}</span><small class="notice-countdown" aria-hidden="true">${tipo === "success" ? "Se cierra en 6 s" : ""}</small></div>
      <button type="button" class="notice-close" data-accion="cerrar-aviso" aria-label="Cerrar aviso">×</button>
      ${tipo === "success" ? '<div class="notice-progress" aria-hidden="true"></div>' : ""}`;
    mensaje.hidden = false;
    if (tipo !== "success") return;
    const fin = Date.now() + 6000;
    // EVENT LOOP: cada callback se ejecuta cuando queda libre la pila.
    // Se consulta el reloj, evitando que los retrasos acumulen un conteo erróneo.
    this.intervaloAviso = setInterval(() => {
      const segundos = Math.max(0, Math.ceil((fin - Date.now()) / 1000));
      mensaje.querySelector(".notice-countdown").textContent =
        `Se cierra en ${segundos} s`;
    }, 1000);
    this.temporizadorAviso = setTimeout(() => this.limpiarAviso(), 6000);
  }

  limpiarAviso() {
    clearTimeout(this.temporizadorAviso);
    clearInterval(this.intervaloAviso);
    this.temporizadorAviso = null;
    this.intervaloAviso = null;
    document.getElementById("mensaje").hidden = true;
  }

  ir(pagina) {
    if (location.hash === `#${pagina}`) this.ruta();
    else location.hash = pagina;
  }

  rutaProducto(producto) {
    if (producto instanceof CuentaAhorros) return "ahorros";
    if (producto instanceof CuentaCorriente) return "corriente";
    return "credito";
  }

  ruta() {
    this.limpiarAviso();
    const ruta = location.hash.slice(1) || "inicio";
    const rutas = ["ahorros", "corriente", "credito"];
    const protegida = rutas.includes(ruta) || ruta === "panel";
    if (protegida && !this.sesion) {
      this.pagina = "login";
    } else if (
      protegida ||
      (this.sesion && ["registro", "login"].includes(ruta))
    ) {
      this.pagina = "panel";
      if (rutas.includes(ruta)) {
        const producto = this.clienteActual.productos[rutas.indexOf(ruta)];
        if (this.seleccionado !== producto.numero) this.seccion = "saldo";
        this.seleccionado = producto.numero;
      }
      // La URL antigua #panel continúa funcionando y se normaliza al producto.
      history.replaceState(
        null,
        "",
        `#${this.rutaProducto(this.productoActual)}`,
      );
    } else {
      this.pagina = ["inicio", "registro", "login"].includes(ruta)
        ? ruta
        : "inicio";
    }
    this.renderizar();
  }

  renderizar() {
    // Una vista reemplazada no debe recibir una cotización pendiente.
    this.eventos.cancelarPendientes();
    document.getElementById("navegacion").innerHTML = this.sesion
      ? `<a href="#${this.rutaProducto(this.productoActual)}" data-ruta-producto="${this.rutaProducto(this.productoActual)}" class="button secondary">Mis productos</a><button class="outline" data-accion="salir">Cerrar sesión</button>`
      : '<a href="#login">Iniciar sesión</a><a class="button" href="#registro">Registrarse ↗</a>';
    if (this.pagina === "inicio")
      this.contenido.innerHTML = this.vistaAcceso.inicioHTML();
    if (this.pagina === "registro")
      this.contenido.innerHTML = this.vistaAcceso.registroHTML();
    if (this.pagina === "login")
      this.contenido.innerHTML = this.vistaAcceso.loginHTML();
    if (this.pagina === "panel")
      this.contenido.innerHTML = this.vistaPanel.panelHTML();
    this.animaciones.mostrarVista(this.contenido);
    this.animaciones.animarMeta(document.getElementById("progreso-meta"));
    const movimientos = this.contenido.querySelector(".movimientos-panel");
    if (movimientos) this.eventos.filtrarMovimientos(movimientos);
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
}

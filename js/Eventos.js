"use strict";

// Escucha los eventos una sola vez, aunque se vuelva a dibujar el contenido.
// Cada formulario tiene un método propio: no hay una función gigante de envíos.
class Eventos {
  constructor(app) {
    this.app = app;
    this.temporizadorCotizacion = null;
    this.temporizadorBusqueda = null;
    this.temporizadorMeta = null;
    this.temporizadorMovimientos = null;
  }

  escuchar() {
    document.addEventListener("click", (evento) => this.alHacerClic(evento));
    document.addEventListener("submit", (evento) => this.alEnviar(evento));
    document.addEventListener("input", (evento) => this.alCambiar(evento));
    document.addEventListener("change", (evento) => this.alCambiar(evento));
    window.addEventListener("hashchange", () => this.app.ruta());
    window.addEventListener("storage", (evento) => {
      if (evento.key === CLAVE_DATOS) window.location.reload();
    });
  }

  alHacerClic(evento) {
    // TRAVERSING: pulsar texto o icono interno activa el enlace de producto.
    const enlace = evento.target.closest("[data-ruta-producto]");
    if (enlace && this.app.sesion) {
      evento.preventDefault();
      this.app.seccion = "saldo";
      this.app.ir(enlace.dataset.rutaProducto);
      return;
    }
    // TRAVERSING: sube desde el elemento pulsado al botón que lo contiene.
    const boton = evento.target.closest("button");
    if (!boton) return;
    const app = this.app;
    try {
      if (boton.dataset.accion === "cerrar-aviso") return app.limpiarAviso();
      if (boton.dataset.accion === "salir") return this.cerrarSesion();
      if (!app.sesion) return;
      if (boton.dataset.accion === "producto-anterior")
        return this.recorrerProductos(-1);
      if (boton.dataset.accion === "producto-siguiente")
        return this.recorrerProductos(1);
      if (boton.dataset.accion === "eliminar-meta") return this.eliminarMeta();
      if (boton.dataset.accion === "mas-movimientos")
        return this.verMasMovimientos(boton);
      if (boton.dataset.accion === "ver-condiciones")
        return this.alternarCondiciones(boton);
      if (boton.dataset.seccion)
        return this.cambiarSeccion(boton.dataset.seccion);
      if (boton.dataset.accion === "seleccionar-credito") {
        return app.ir("credito");
      }
      if (boton.dataset.editar || boton.dataset.accion === "nuevo-usuario") {
        return this.abrirEditor(boton.dataset.editar || null);
      }
      if (boton.dataset.desbloquear)
        return this.desbloquear(boton.dataset.desbloquear);
      if (boton.dataset.eliminar) return this.eliminar(boton.dataset.eliminar);
    } catch (error) {
      app.avisar(error.message, "error");
    }
  }

  actualizarPanel() {
    this.app.recibo = null;
    this.app.limpiarAviso();
    this.app.renderizar();
  }

  cerrarSesion() {
    const app = this.app;
    app.sesion = null;
    app.seleccionado = null;
    app.editorId = null;
    app.recibo = null;
    this.cancelarPendientes();
    app.ir("login");
  }

  cambiarSeccion(seccion) {
    this.app.seccion = seccion;
    this.app.editorId = null;
    this.actualizarPanel();
  }

  recorrerProductos(direccion) {
    const lista = document.getElementById("rutas-productos");
    const actual = lista.querySelector('[aria-current="page"]');
    // TRAVERSING: recorrer enlaces hermanos, con retorno circular al extremo.
    const destino =
      direccion > 0
        ? actual.nextElementSibling || lista.firstElementChild
        : actual.previousElementSibling || lista.lastElementChild;
    this.app.ir(destino.dataset.rutaProducto);
  }

  alternarCondiciones(boton) {
    // TRAVERSING lateral: el bloque de condiciones es hermano del botón.
    const condiciones = boton.nextElementSibling;
    condiciones.hidden = !condiciones.hidden;
    boton.setAttribute("aria-expanded", String(!condiciones.hidden));
    boton.lastElementChild.textContent = condiciones.hidden ? "+" : "-";
  }

  abrirEditor(id) {
    this.app.editorId = id;
    this.actualizarPanel();
    const editor = document.getElementById("editor-usuario");
    editor.scrollIntoView({ block: "start" });
    // Descendemos desde el editor, evitando buscar en otros formularios.
    editor
      .querySelector('[name="identificacion"]')
      .focus({ preventScroll: true });
  }

  desbloquear(id) {
    this.app.banco.ejecutar(() => this.app.banco.cliente(id).desbloquear());
    this.app.renderizar();
    this.app.avisar("Usuario desbloqueado. Intentos reiniciados a 0 de 3.");
  }

  eliminar(id) {
    const app = this.app;
    const cliente = app.banco.cliente(id);
    if (
      !window.confirm(
        `¿Eliminar a ${cliente.nombre} y todos sus productos? Esta acción no se puede deshacer.`,
      )
    )
      return;
    app.banco.ejecutar(() => app.banco.eliminar(id));
    if (app.editorId === id) app.editorId = null;
    if (app.sesion === id) {
      app.sesion = null;
      app.seleccionado = null;
      app.pagina = "login";
      history.replaceState(null, "", "#login");
    }
    app.renderizar();
    app.avisar("Usuario eliminado correctamente.");
  }

  alEnviar(evento) {
    const formulario = evento.target;
    if (!(formulario instanceof HTMLFormElement)) return;
    evento.preventDefault();
    if (!formulario.reportValidity()) return;
    const datos = Object.fromEntries(new FormData(formulario));
    const app = this.app;
    app.limpiarAviso();
    try {
      if (formulario.id === "registro") return this.registrar(datos);
      if (formulario.id === "login")
        return this.iniciarSesion(datos, formulario);
      if (!app.sesion)
        throw new Error("Inicia sesión para realizar esta operación.");
      app.recibo = null;
      let mensaje;
      // switch enruta el formulario; los detalles están en métodos pequeños.
      switch (formulario.id) {
        case "meta-ahorro":
          mensaje = this.guardarMeta(datos);
          break;
        case "perfil":
          mensaje = this.guardarPerfil(datos);
          break;
        case "cambiar-clave":
          mensaje = this.cambiarClave(datos);
          break;
        case "usuario-admin":
          mensaje = this.guardarUsuario(datos);
          break;
        case "consignar":
          mensaje = this.consignar(datos);
          break;
        case "retirar":
          mensaje = this.retirar(datos);
          break;
        case "comprar":
          mensaje = this.comprar(datos);
          break;
        case "transferir":
          mensaje = this.transferir(datos);
          break;
        default:
          return;
      }
      app.renderizar();
      app.avisar(mensaje);
    } catch (error) {
      app.avisar(error.message, "error");
    }
  }

  registrar(datos) {
    this.app.banco.ejecutar(() => this.app.banco.registrar(datos));
    this.app.pagina = "login";
    history.replaceState(null, "", "#login");
    this.app.renderizar();
    this.app.avisar(
      "Registro exitoso. Tus cuentas inician en $0 y tu tarjeta tiene $3.000.000 de cupo. Inicia sesión.",
    );
  }

  iniciarSesion(datos, formulario) {
    const app = this.app;
    const resultado = app.banco.ejecutar(() =>
      app.banco.autenticar(datos.usuario, datos.clave),
    );
    this.actualizarIntentos(formulario);
    if (resultado.error) {
      formulario.querySelector('[name="clave"]').value = "";
      app.avisar(resultado.error, "error");
      return;
    }
    app.sesion = resultado.cliente.id;
    app.seleccionado = resultado.cliente.productos[0].numero;
    app.seccion = "saldo";
    app.recibo = null;
    app.editorId = null;
    app.pagina = "panel";
    history.replaceState(null, "", "#ahorros");
    app.renderizar();
    app.avisar("Sesión iniciada. Bienvenido a Mi Plata.");
  }

  guardarPerfil(datos) {
    this.app.banco.ejecutar(() =>
      this.app.banco.editar(this.app.sesion, datos),
    );
    return "Perfil actualizado correctamente.";
  }

  cambiarClave(datos) {
    if (datos.usuario.trim().toLowerCase() !== this.app.clienteActual.usuario) {
      throw new Error("El usuario no corresponde a tu sesión.");
    }
    validarClave(datos.nueva, datos.confirmacion);
    this.app.banco.ejecutar(() =>
      this.app.clienteActual.cambiarClave(datos.actual, datos.nueva),
    );
    return "Contraseña actualizada correctamente. Úsala en tu próximo inicio de sesión.";
  }

  guardarUsuario(datos) {
    const app = this.app;
    const editando = Boolean(app.editorId);
    app.banco.ejecutar(() =>
      editando
        ? app.banco.editar(app.editorId, datos)
        : app.banco.registrar(datos),
    );
    app.editorId = null;
    return editando
      ? "Usuario actualizado correctamente."
      : "Usuario creado con sus tres productos.";
  }

  consignar(datos) {
    const app = this.app;
    app.banco.ejecutar(() => app.productoActual.consignar(datos.monto));
    return app.productoActual instanceof TarjetaCredito
      ? `Pago realizado. Deuda de capital: ${pesos(app.productoActual.saldo)}.`
      : `Consignación exitosa. Nuevo saldo: ${pesos(app.productoActual.saldo)}.`;
  }

  retirar(datos) {
    const app = this.app;
    const resultado = app.banco.ejecutar(() =>
      app.productoActual.retirar(datos.monto),
    );
    return `Retiraste ${pesos(resultado.monto)}. Rendimiento abonado: ${pesos(resultado.interes)}. Nuevo saldo: ${pesos(app.productoActual.saldo)}.`;
  }

  comprar(datos) {
    const app = this.app;
    if (!(app.productoActual instanceof TarjetaCredito))
      throw new Error("Selecciona la tarjeta de crédito.");
    const resultado = app.banco.ejecutar(() =>
      app.productoActual.comprar(datos.monto, datos.cuotas),
    );
    app.recibo = this.textoRecibo(resultado);
    return "Compra aprobada. Tu cupo y tus movimientos fueron actualizados.";
  }

  transferir(datos) {
    const app = this.app;
    const resultado = app.banco.ejecutar(() =>
      app.banco.transferir(
        app.sesion,
        app.seleccionado,
        datos.destino,
        datos.monto,
        datos.cuotas,
      ),
    );
    if (app.productoActual instanceof TarjetaCredito)
      app.recibo = this.textoRecibo(resultado);
    return `Transferencia exitosa de ${pesos(resultado.monto)} al producto ${datos.destino}. Ambos movimientos quedaron registrados.`;
  }

  textoRecibo(resultado) {
    return `${resultado.cuotas} cuota(s) de ${pesos(resultado.pagoMensual)}. Tasa mensual: ${(resultado.tasa * 100).toFixed(1)} %. Total estimado a pagar: ${pesos(resultado.total)}. Cupo restante: ${pesos(this.app.productoActual.disponible)}. La última cuota puede variar por redondeo.`;
  }

  actualizarIntentos(formulario) {
    if (!formulario) return;
    const campo = formulario.querySelector('[name="usuario"]');
    const indicador = formulario.querySelector("#intentos");
    if (!campo || !indicador) return;
    const cliente = this.app.banco.buscarUsuario(campo.value);
    indicador.textContent = `Intentos fallidos: ${cliente?.intentos || 0} de 3. ${cliente?.bloqueado ? "Cuenta bloqueada." : "La cuenta se bloquea al tercero."}`;
  }

  alCambiar(evento) {
    const panelMovimientos = evento.target.closest(".movimientos-panel");
    if (
      panelMovimientos &&
      ["buscar-movimientos", "tipo-movimiento"].includes(evento.target.id)
    )
      return this.programarMovimientos(panelMovimientos);
    if (evento.target.closest("#meta-ahorro"))
      return this.programarMeta(evento.target.closest("form"));
    if (evento.target.id === "buscar-usuarios")
      return this.programarBusqueda(evento.target);
    // TRAVERSING ascendente: obtenemos el formulario dueño del campo editado.
    const formulario = evento.target.closest("form");
    if (!formulario) return;
    if (evento.target.id === "login-usuario")
      this.actualizarIntentos(formulario);
    if (!["monto", "cuotas"].includes(evento.target.name) || !this.app.sesion)
      return;
    const cotizacion = formulario.querySelector("#cotizacion");
    if (!cotizacion) return;
    this.cancelarCotizacion();
    cotizacion.textContent = "Actualizando tu simulación…";
    cotizacion.classList.add("is-loading");
    cotizacion.classList.remove("has-error");
    cotizacion.setAttribute("aria-busy", "true");
    // EVENT LOOP + debounce: cada tecla cancela la tarea pendiente y programa
    // otra. Se calcula tras al menos 450 ms sin cambios, sin bloquear la página.
    // setTimeout NO crea otro hilo ni vuelve asíncrono el cálculo financiero.
    this.temporizadorCotizacion = setTimeout(() => {
      this.temporizadorCotizacion = null;
      if (formulario.isConnected && this.app.sesion) this.cotizar(formulario);
    }, 450);
  }

  cancelarCotizacion() {
    clearTimeout(this.temporizadorCotizacion);
    this.temporizadorCotizacion = null;
  }

  cancelarPendientes() {
    this.cancelarCotizacion();
    clearTimeout(this.temporizadorBusqueda);
    this.temporizadorBusqueda = null;
    clearTimeout(this.temporizadorMeta);
    clearTimeout(this.temporizadorMovimientos);
    this.temporizadorMeta = null;
    this.temporizadorMovimientos = null;
    this.app.animaciones.cancelar();
  }

  programarBusqueda(campo) {
    clearTimeout(this.temporizadorBusqueda);
    const panel = campo.closest("#lista-usuarios");
    panel.querySelector("#resultado-busqueda").textContent = "Buscando…";
    // EVENT LOOP: debounce para filtrar una sola vez tras dejar de escribir.
    this.temporizadorBusqueda = setTimeout(() => {
      this.temporizadorBusqueda = null;
      if (campo.isConnected && this.app.sesion) this.filtrarUsuarios(campo);
    }, 300);
  }

  filtrarUsuarios(campo) {
    const panel = campo.closest("#lista-usuarios");
    const normalizar = (texto) =>
      texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const consulta = normalizar(campo.value.trim());
    const cuerpo = panel.querySelector("tbody");
    let visibles = 0;
    // TRAVERSING: tbody.children devuelve sus filas y fila.children sus celdas.
    // Solo cambia hidden: no se elimina ningún cliente ni se reconstruye la tabla.
    for (const fila of cuerpo.children) {
      const datos =
        fila.children[0].textContent + " " + fila.children[1].textContent;
      fila.hidden = !normalizar(datos).includes(consulta);
      if (!fila.hidden) visibles++;
    }
    panel.querySelector("#resultado-busqueda").textContent =
      `${visibles} de ${cuerpo.children.length} cliente(s)`;
    panel.querySelector("#sin-resultados").hidden = visibles !== 0;
  }

  guardarMeta(datos) {
    if (!(this.app.productoActual instanceof CuentaAhorros))
      throw new Error("Las metas están disponibles en Ahorros.");
    this.app.metas.guardar(this.app.sesion, datos.nombre, datos.monto);
    return "Tu meta quedó guardada. Cada paso cuenta.";
  }

  eliminarMeta() {
    if (!window.confirm("¿Eliminar esta meta? Tu saldo no cambia.")) return;
    this.app.metas.eliminar(this.app.sesion);
    this.app.renderizar();
    this.app.avisar(
      "Meta eliminada. Puedes comenzar una nueva cuando quieras.",
    );
  }

  programarMeta(formulario) {
    clearTimeout(this.temporizadorMeta);
    const aviso = formulario.querySelector("#vista-previa-meta");
    aviso.textContent = "Calculando tu avance…";
    // EVENT LOOP: esperar una pausa evita calcular por cada tecla.
    this.temporizadorMeta = setTimeout(() => {
      this.temporizadorMeta = null;
      if (!formulario.isConnected || !this.app.sesion) return;
      try {
        const meta = validarMonto(
          formulario.querySelector('[name="monto"]').value,
        );
        const saldo = Math.max(0, this.app.productoActual.saldo);
        aviso.textContent = `Tu saldo cubre el ${Math.min(100, (saldo / meta) * 100).toFixed(1)} % de este objetivo. Te faltan ${pesos(Math.max(0, meta - saldo))}.`;
      } catch (error) {
        aviso.textContent =
          "Ingresa un objetivo positivo para calcular tu avance.";
      }
    }, 300);
  }

  programarMovimientos(panel) {
    clearTimeout(this.temporizadorMovimientos);
    panel.dataset.limite = "5";
    panel.querySelector("[data-conteo]").textContent = "Filtrando movimientos…";
    this.temporizadorMovimientos = setTimeout(() => {
      this.temporizadorMovimientos = null;
      if (panel.isConnected && this.app.sesion) this.filtrarMovimientos(panel);
    }, 250);
  }

  filtrarMovimientos(panel) {
    const consulta = panel
      .querySelector("#buscar-movimientos")
      .value.trim()
      .toLowerCase();
    const tipo = panel.querySelector("#tipo-movimiento").value;
    const limite = Number(panel.dataset.limite || 5);
    let encontrados = 0;
    // TRAVERSING: recorrer los hijos de tbody; ocultar filas conserva sus nodos.
    for (const fila of panel.querySelector("tbody").children) {
      const coincide =
        (!tipo || fila.dataset.tipo === tipo) &&
        fila.textContent.toLowerCase().includes(consulta);
      fila.hidden = !coincide || encontrados >= limite;
      if (coincide) encontrados++;
    }
    panel.querySelector("[data-conteo]").textContent =
      `${Math.min(limite, encontrados)} de ${encontrados} movimiento(s)`;
    panel.querySelector("[data-sin-movimientos]").hidden = encontrados !== 0;
    const boton = panel.querySelector('[data-accion="mas-movimientos"]');
    boton.hidden = encontrados <= limite;
    boton.disabled = false;
    boton.textContent = "Ver 5 movimientos más";
  }

  verMasMovimientos(boton) {
    // TRAVERSING ascendente: del botón al panel al que pertenece.
    const panel = boton.closest(".movimientos-panel");
    boton.disabled = true;
    boton.textContent = "Mostrando más…";
    clearTimeout(this.temporizadorMovimientos);
    this.temporizadorMovimientos = setTimeout(() => {
      this.temporizadorMovimientos = null;
      if (!panel.isConnected || !this.app.sesion) return;
      panel.dataset.limite = String(Number(panel.dataset.limite || 5) + 5);
      this.filtrarMovimientos(panel);
    }, 250);
  }

  cotizar(formulario) {
    const cotizacion = formulario.querySelector("#cotizacion");
    cotizacion.classList.remove("is-loading");
    cotizacion.setAttribute("aria-busy", "false");
    const monto = formulario.querySelector('[name="monto"]').value;
    // TRAVERSING lateral: la cotización viene después del contenedor de cuotas.
    // Desde ese hermano anterior descendemos al input, siempre en el mismo form.
    const campoCuotas =
      cotizacion.previousElementSibling.querySelector('[name="cuotas"]');
    const cuotas = campoCuotas.value;
    if (!monto) {
      cotizacion.textContent =
        "Ingresa un monto para consultar tu cuota mensual.";
      return;
    }
    try {
      const resultado = this.app.productoActual.calcularRetiro(monto, cuotas);
      cotizacion.textContent = `${resultado.cuotas} cuota(s) de ${pesos(resultado.pagoMensual)} · ${(resultado.tasa * 100).toFixed(1)} % mensual · Total estimado: ${pesos(resultado.total)}. La última cuota puede variar por redondeo.`;
    } catch (error) {
      cotizacion.classList.add("has-error");
      cotizacion.textContent = error.message;
    }
  }
}

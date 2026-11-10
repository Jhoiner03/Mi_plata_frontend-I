"use strict";

class VistaPanel {
  constructor(app) {
    this.app = app;
  }

  // Cada producto tiene su ruta y se muestra solo uno a la vez.
  panelHTML() {
    const producto = this.app.productoActual;
    const credito = producto instanceof TarjetaCredito;
    const ahorro = producto instanceof CuentaAhorros;
    const numero = credito ? 3 : ahorro ? 1 : 2;
    const opciones = credito
      ? [
          ["saldo", "Resumen"],
          ["comprar", "Comprar / financiar"],
          ["consignar", "Pagar tarjeta"],
          ["transferir", "Transferir"],
          ["movimientos", "Movimientos"],
        ]
      : [
          ["saldo", "Resumen"],
          ["consignar", "Consignar"],
          ["retirar", "Retirar"],
          ["transferir", "Transferir"],
          ["movimientos", "Movimientos"],
          ...(ahorro ? [["meta", "Mi meta de ahorro"]] : []),
        ];
    return /* HTML */ `<div class="bank-layout">
      <aside class="sidebar">
        <div class="sidebar-heading">
          <span class="eyebrow">TU ESPACIO PERSONAL</span
          ><strong>Todo empieza con un plan.</strong>
        </div>
        <span class="sidebar-label">MIS PRODUCTOS</span>
        <nav
          id="rutas-productos"
          class="product-routes"
          aria-label="Páginas de productos"
        >
          ${this.enlaceProducto("ahorros", "Cuenta de ahorros", "Para tus próximos planes", "01", ahorro)}
          ${this.enlaceProducto("corriente", "Cuenta corriente", "Para tu día a día", "02", !ahorro && !credito)}
          ${this.enlaceProducto("credito", "Tarjeta de crédito", "Para ir un poco más allá", "03", credito)}
        </nav>
        <div class="sidebar-divider"></div>
        <span class="sidebar-label">MI CUENTA</span>
        <button
          class="side-action ${this.app.seccion === "perfil" ? "active" : ""}"
          data-seccion="perfil"
        >
          Mi perfil <span aria-hidden="true">↗</span>
        </button>
        <button
          class="side-action ${this.app.seccion === "usuarios" ? "active" : ""}"
          data-seccion="usuarios"
        >
          Usuarios del simulador <span aria-hidden="true">↗</span>
        </button>
        <div class="sidebar-note">
          <span class="note-orbit" aria-hidden="true">✦</span
          ><strong>Pequeños pasos.<br />Grandes posibilidades.</strong>
          <p>Un espacio para organizar tus planes a tu ritmo.</p>
        </div>
      </aside>
      <section
        class="workspace"
        data-producto-pagina="${this.app.rutaProducto(producto)}"
      >
        <div class="workspace-heading">
          <div>
            <div class="eyebrow">MIS PRODUCTOS / ${escapar(producto.tipo)}</div>
            <h1>
              ${credito ? "Tu tarjeta de crédito" : ahorro ? "Tu cuenta de ahorros" : "Tu cuenta corriente"}
            </h1>
            <p>
              ${credito ? "Más posibilidades, con tus cuentas claras." : ahorro ? "El mejor momento para empezar es hoy." : "Tu dinero listo para acompañarte."}
            </p>
          </div>
          <span class="badge"
            >Hola, ${escapar(this.app.clienteActual.nombre.split(" ")[0])}</span
          >
        </div>
        <article
          class="account-overview account-${this.app.rutaProducto(producto)}"
        >
          <div class="account-balance">
            <span class="eyebrow"
              >${credito ? "CUPO DISPONIBLE" : "SALDO ACTUAL"}</span
            ><strong class="amount"
              >${pesos(credito ? producto.disponible : producto.saldo)}</strong
            ><span class="account-id"
              >${credito ? "Tarjeta" : "Cuenta"} N.º ${producto.numero} ·
              COP</span
            ><button class="account-link" data-seccion="movimientos">
              Ver mis movimientos <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div class="mini-card" aria-hidden="true">
            <span class="mini-mark"
              >mi plata / ${String(numero).padStart(2, "0")}</span
            ><span class="mini-chip"></span
            ><span class="mini-digits"
              >•••• &nbsp; •••• &nbsp; ${producto.numero.slice(-4)}</span
            ><span class="mini-caption"
              >${credito ? "CRÉDITO" : ahorro ? "AHORROS" : "CORRIENTE"}</span
            >
          </div>
        </article>
        <div class="workspace-tools">
          <span class="workspace-hint"
            >Un producto. Todas sus posibilidades.</span
          >
          <div class="product-controls">
            <button
              class="outline small-button"
              data-accion="producto-anterior"
              aria-label="Ir al producto anterior"
            >
              ← Anterior</button
            ><span class="page-number">0${numero} / 03</span
            ><button
              class="outline small-button"
              data-accion="producto-siguiente"
              aria-label="Ir al producto siguiente"
            >
              Siguiente →
            </button>
          </div>
        </div>
        <nav
          class="dashboard-nav"
          aria-label="Operaciones de ${escapar(producto.tipo)}"
        >
          ${opciones.map(([id, texto]) => `<button data-seccion="${id}" class="${this.app.seccion === id ? "active" : ""}" ${this.app.seccion === id ? 'aria-current="true"' : ""}>${texto}</button>`).join("")}
        </nav>
        <div id="detalle-producto">${this.contenidoHTML(producto)}</div>
      </section>
    </div>`;
  }

  enlaceProducto(ruta, titulo, descripcion, numero, activo) {
    return `<a href="#${ruta}" data-ruta-producto="${ruta}" class="product-route ${activo ? "active" : ""}" ${activo ? 'aria-current="page"' : ""}><span class="route-icon" aria-hidden="true">${numero}</span><span><strong>${titulo}</strong><small>${descripcion}</small></span><span class="route-arrow" aria-hidden="true">↗</span></a>`;
  }

  contenidoHTML(producto) {
    switch (this.app.seccion) {
      case "usuarios":
        return this.app.vistaUsuarios.usuariosHTML();
      case "perfil":
        return this.app.vistaUsuarios.perfilHTML();
      case "movimientos":
        return this.app.vistaProductos.movimientosHTML(producto);
      case "meta":
        return producto instanceof CuentaAhorros
          ? this.app.vistaMetas.metaHTML()
          : this.app.vistaProductos.seccionHTML(producto);
      default:
        return this.app.vistaProductos.seccionHTML(producto);
    }
  }
}

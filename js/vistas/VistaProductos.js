"use strict";

// Esta clase genera HTML; las operaciones se realizan en Banco y los modelos.
class VistaProductos {
  constructor(app) {
    this.app = app;
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
      <button
        type="button"
        class="details-toggle"
        data-accion="ver-condiciones"
        aria-expanded="false"
        aria-controls="condiciones-producto"
      >
        Ver condiciones del producto <span aria-hidden="true">+</span>
      </button>
      <div id="condiciones-producto" class="product-conditions" hidden>
        <p>
          ${producto instanceof CuentaAhorros ? "Rendimiento del 1,5 % mensual liquidado al retirar. El primer retiro simula el primer mes; luego se liquida una vez por mes calendario. El retiro se valida contra el saldo previo al interés." : tarjeta ? "1–2 cuotas: 0 %. De 3 a 6: 1,9 % mensual. Desde 7: 2,3 % mensual. Las cuotas usan la fórmula de anualidad del documento." : "No genera intereses. Puedes retirar hasta el 120 % de tu saldo positivo. Si quedas en sobregiro, debes consignar antes de volver a retirar."}
        </p>
        ${tarjeta ? "<p>Los abonos reducen el capital y liberan cupo. Las cuotas son una simulación informativa; no hay calendario de cobros ni liquidación de pagos mensuales.</p>" : ""}
        <p>Moneda: pesos colombianos (COP).</p>
      </div>
    </aside>`;
  }

  seccionHTML(producto) {
    let contenido;
    switch (this.app.seccion) {
      case "saldo":
        contenido = this.saldoHTML(producto);
        break;
      case "consignar":
        contenido = this.consignarHTML(producto);
        break;
      case "retirar":
        contenido = this.retirarHTML(producto);
        break;
      case "comprar":
        contenido = this.comprarHTML(producto);
        break;
      case "transferir":
        contenido = this.transferirHTML(producto);
        break;
      default:
        contenido = this.saldoHTML(producto);
    }
    return /* HTML */ `<div class="transaction-layout">
      <section class="panel">
        ${contenido}
        ${this.app.recibo ? `<div class="receipt" role="status">${escapar(this.app.recibo)}</div>` : ""}
      </section>
      ${this.resumenHTML(producto)}
    </div>`;
  }

  saldoHTML(producto) {
    return /* HTML */ `<h2>Tu plata, a la vista.</h2>
      <p class="muted">Usa el menú de productos para cambiar de cuenta.</p>
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

  consignarHTML(producto) {
    const tarjeta = producto instanceof TarjetaCredito;
    return /* HTML */ `<h2>
        ${tarjeta ? "Pagar tarjeta" : "Consignar dinero"}
      </h2>
      <p class="muted">
        ${tarjeta ? "Abona a tu deuda de capital y recupera cupo disponible." : "Tu saldo se actualizará al confirmar la consignación."}
      </p>
      <form id="consignar">
        ${this.app.formularios.montoHTML()}<button type="submit">
          ${tarjeta ? "Confirmar pago" : "Confirmar consignación"} ↗
        </button>
      </form>`;
  }

  retirarHTML(producto) {
    return producto instanceof TarjetaCredito
      ? '<h2>Esta es tu tarjeta de crédito.</h2><p>Utiliza la opción Comprar / financiar para elegir tus cuotas.</p><button data-seccion="comprar">Ir a compras ↗</button>'
      : /* HTML */ `<h2>Retirar dinero</h2>
          <p class="muted">
            Disponible para retirar: ${pesos(producto.disponible)}.
          </p>
          <form id="retirar">
            ${this.app.formularios.montoHTML()}<button type="submit">
              Confirmar retiro ↗
            </button>
          </form>`;
  }

  comprarHTML(producto) {
    return producto instanceof TarjetaCredito
      ? /* HTML */ `<h2>Un plan para tu compra.</h2>
          <p class="muted">
            Elige las cuotas y consulta el pago mensual antes de confirmar.
          </p>
          <form id="comprar">
            ${this.app.formularios.montoHTML("Valor de la compra en COP")}${this.app.formularios.cuotasHTML()}<button
              type="submit"
            >
              Confirmar compra ↗
            </button>
          </form>`
      : '<h2>Selecciona tu tarjeta de crédito.</h2><p>Las compras a cuotas están disponibles en el producto Crédito.</p><button data-accion="seleccionar-credito">Seleccionar crédito ↗</button>';
  }

  transferirHTML(producto) {
    const destinos = this.app.banco.clientes
      .map((cliente) => {
        const cuentas = cliente.productos.filter(
          (cuenta) => cuenta.numero !== producto.numero,
        );
        return /* HTML */ `<optgroup
          label="${escapar(cliente.id === this.app.sesion ? "Mis productos" : cliente.nombre)}"
        >
          ${cuentas.map((cuenta) => /* HTML */ `<option value="${cuenta.numero}">${escapar(cliente.usuario)} · ${cuenta.tipo} · ${cuenta.numero}${cuenta instanceof TarjetaCredito ? " (pago de deuda)" : ""}</option>`).join("")}
        </optgroup>`;
      })
      .join("");
    return /* HTML */ `<h2>Que tu plata se mueva.</h2>
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
        ${this.app.formularios.montoHTML()}${producto instanceof TarjetaCredito ? this.app.formularios.cuotasHTML() : ""}<button
          type="submit"
        >
          Confirmar transferencia ↗
        </button>
      </form>`;
  }

  movimientosHTML(producto) {
    const movimientos = producto.movimientos
      .reverse()
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const tipos = [
      ...new Set(movimientos.map((movimiento) => movimiento.tipo)),
    ];
    return /* HTML */ `<section class="panel movimientos-panel" data-limite="5">
      <div class="section-heading">
        <div>
          <span class="eyebrow">TU ACTIVIDAD</span>
          <h2>Cada movimiento, en su lugar.</h2>
          <p>${producto.tipo} · ${producto.numero} · Más reciente primero.</p>
        </div>
        <span class="badge">${movimientos.length} movimiento(s)</span>
      </div>
      <div class="history-filters">
        <div class="field">
          <label for="buscar-movimientos">Buscar en el historial</label
          ><input
            type="search"
            id="buscar-movimientos"
            placeholder="Busca por detalle, valor o fecha"
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="tipo-movimiento">Tipo de movimiento</label
          ><select id="tipo-movimiento">
            <option value="">Todos los tipos</option>
            ${tipos.map((tipo) => `<option value="${escapar(tipo)}">${escapar(tipo)}</option>`).join("")}
          </select>
        </div>
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
            ${movimientos.map((movimiento) => this.filaMovimientoHTML(movimiento)).join("")}
          </tbody>
        </table>
      </div>
      <p class="empty" data-sin-movimientos hidden>
        No hay movimientos que coincidan con esta búsqueda.
      </p>
      <div class="history-bottom">
        <span data-conteo role="status"
          >${Math.min(5, movimientos.length)} de ${movimientos.length}
          movimiento(s)</span
        ><button
          type="button"
          class="outline small-button"
          data-accion="mas-movimientos"
          ${movimientos.length <= 5 ? "hidden" : ""}
        >
          Ver 5 movimientos más
        </button>
      </div>
    </section>`;
  }

  filaMovimientoHTML(movimiento) {
    return `<tr data-tipo="${escapar(movimiento.tipo)}"><td>${escapar(new Date(movimiento.fecha).toLocaleString("es-CO"))}</td><td><strong>${escapar(movimiento.tipo)}</strong><small>${escapar(movimiento.detalle)}</small></td><td class="money">${pesos(movimiento.valor)}</td><td class="money ${movimiento.impacto < 0 ? "negative" : "positive"}">${movimiento.impacto > 0 ? "+" : ""}${pesos(movimiento.impacto)}</td></tr>`;
  }
}

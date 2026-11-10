"use strict";

class VistaMetas {
  constructor(app) {
    this.app = app;
  }

  metaHTML() {
    const meta = this.app.metas.obtener(this.app.sesion);
    const saldo = Math.max(0, this.app.productoActual.saldo);
    const porcentaje = meta ? Math.min(100, (saldo / meta.monto) * 100) : 0;
    return /* HTML */ `<div class="two-panels goal-layout">
      <section class="panel" id="progreso-meta">
        <span class="eyebrow">UN PASO MÁS CERCA</span>
        <h2>
          ${meta ? escapar(meta.nombre) : "Dale un propósito a tu ahorro."}
        </h2>
        <p class="muted">
          ${meta ? "Tu avance se calcula con el saldo actual de Ahorros." : "Define un objetivo y mira cómo tu saldo te acerca a él."}
        </p>
        <strong class="goal-percent" data-porcentaje>0 %</strong>
        <div class="goal-track">
          <div
            class="goal-bar"
            role="progressbar"
            aria-label="Avance de tu meta"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${Math.round(porcentaje)}"
            data-porcentaje="${porcentaje}"
            style="width:0%"
          ></div>
        </div>
        <div class="goal-figures">
          <span>Tu saldo <strong>${pesos(saldo)}</strong></span
          ><span
            >Objetivo
            <strong>${meta ? pesos(meta.monto) : "Por definir"}</strong></span
          >
        </div>
        <p class="goal-status">
          ${!meta ? "Empieza con una meta que te motive." : porcentaje >= 100 ? "¡Llegaste a tu objetivo! Puedes definir tu siguiente meta." : `Te faltan ${pesos(meta.monto - saldo)} para llegar.`}
        </p>
        <p class="help">
          Es una referencia visual. El dinero sigue disponible para tus
          operaciones.
        </p>
      </section>
      <section class="panel">
        <span class="eyebrow">A TU MEDIDA</span>
        <h2>${meta ? "Ajustar mi meta" : "Crear mi primera meta"}</h2>
        <form id="meta-ahorro">
          <div class="field">
            <label for="meta-nombre">¿Para qué estás ahorrando?</label
            ><input
              id="meta-nombre"
              name="nombre"
              minlength="3"
              maxlength="45"
              required
              placeholder="Ej. Mi próximo semestre"
              value="${escapar(meta?.nombre || "")}"
            />
          </div>
          <div class="field">
            <label for="meta-monto">Valor de tu objetivo en COP</label
            ><input
              id="meta-monto"
              name="monto"
              type="number"
              min="0.01"
              max="${MAX_DINERO}"
              step="0.01"
              required
              placeholder="Ej. 2000000"
              value="${meta?.monto || ""}"
            />
          </div>
          <p id="vista-previa-meta" class="attempts" aria-live="polite">
            Escribe un objetivo para ver tu avance estimado.
          </p>
          <div class="actions">
            <button type="submit">Guardar mi meta ↗</button
            >${meta ? '<button type="button" class="outline" data-accion="eliminar-meta">Eliminar meta</button>' : ""}
          </div>
        </form>
      </section>
    </div>`;
  }
}

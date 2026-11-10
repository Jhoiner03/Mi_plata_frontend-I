"use strict";

// Esta clase genera HTML; las operaciones se realizan en Banco y los modelos.
class Formularios {
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
}

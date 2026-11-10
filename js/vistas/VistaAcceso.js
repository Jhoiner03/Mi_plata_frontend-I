"use strict";

// Esta clase genera HTML; las operaciones se realizan en Banco y los modelos.
class VistaAcceso {
  constructor(app) {
    this.app = app;
  }

  inicioHTML() {
    return /* HTML */ `<section class="hero hero-new">
        <div>
          <span class="eyebrow">UN ESPACIO PARA CADA PLAN</span>
          <h1>
            Tu futuro tiene<br />muchas formas.<br /><em>Hazlo posible.</em>
          </h1>
          <p>
            Ahorra para lo que viene, organiza tu día a día y descubre nuevas
            posibilidades. Todo a tu ritmo, todo en un mismo lugar.
          </p>
          <div class="actions">
            <a href="#registro" class="button">Empieza tu próximo plan ↗</a
            ><a href="#login" class="button outline">Ya tengo una cuenta</a>
          </div>
          <div class="hero-footnote">
            <span aria-hidden="true">✦</span> Cada pequeño paso también cuenta.
          </div>
        </div>
        <div
          class="plan-illustration"
          aria-label="Ilustración de una meta de ahorro"
        >
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <span class="floating-star" aria-hidden="true">✦</span>
          <div class="preview-card">
            <div class="preview-top">
              <span>mi plata.</span><span aria-hidden="true">↗</span>
            </div>
            <span class="eyebrow">ESE PLAN QUE TE MUEVE</span
            ><strong>Un nuevo comienzo.</strong>
            <p>Más cerca, paso a paso.</p>
            <div class="preview-progress"><span></span></div>
            <div class="preview-bottom">
              <span>Tu próxima meta</span><strong>75 %</strong>
            </div>
          </div>
          <div class="preview-note">
            <span class="preview-tick" aria-hidden="true">✓</span>
            <div>
              <strong>El primer paso es tuyo.</strong
              ><span>Nosotros te acompañamos.</span>
            </div>
          </div>
        </div>
      </section>
      <section class="intro-products">
        <div class="section-heading">
          <div>
            <span class="eyebrow">TRES MANERAS DE AVANZAR</span>
            <h2>Lo que necesitas.<br />En su propio espacio.</h2>
          </div>
          <p>
            Cada producto tiene una pantalla dedicada,<br />con las herramientas
            que necesitas.
          </p>
        </div>
        <div class="grid-three">
          <article class="feature">
            <span class="number">01 / AHORROS</span>
            <h3>Planes que crecen.</h3>
            <p>
              Define tu meta, consulta tu avance y dale un propósito a tu
              ahorro.
            </p>
          </article>
          <article class="feature">
            <span class="number">02 / CORRIENTE</span>
            <h3>Tu día, en orden.</h3>
            <p>Organiza tus movimientos y lleva el control de lo cotidiano.</p>
          </article>
          <article class="feature">
            <span class="number">03 / CRÉDITO</span>
            <h3>Posibilidades claras.</h3>
            <p>Consulta tu cupo y simula las cuotas antes de decidir.</p>
          </article>
        </div>
      </section>`;
  }

  registroHTML() {
    return /* HTML */ `<section class="auth">
      <div class="eyebrow">TU SIGUIENTE PASO</div>
      <div class="panel">
        <h1>Hagamos espacio<br />para tus metas.</h1>
        <p>Regístrate y recibe tus tres productos de prueba.</p>
        <form id="registro">
          ${this.app.formularios.camposCliente()}${this.app.formularios.camposClave()}<button
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
}

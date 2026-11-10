"use strict";

// Esta clase genera HTML; las operaciones se realizan en Banco y los modelos.
class VistaUsuarios {
  constructor(app) {
    this.app = app;
  }

  perfilHTML() {
    return /* HTML */ `<div class="two-panels">
      <section class="panel">
        <h2>Tu perfil</h2>
        <p class="muted">Mantén tus datos al día.</p>
        <form id="perfil">
          ${this.app.formularios.camposCliente(this.app.clienteActual)}<button
            type="submit"
          >
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
    const editado = this.app.editorId
      ? this.app.banco.cliente(this.app.editorId)
      : null;
    return /* HTML */ `<section class="panel" id="lista-usuarios">
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
        <div class="search-toolbar">
          <div class="field search-field">
            <label for="buscar-usuarios">Buscar cliente</label>
            <input
              type="search"
              id="buscar-usuarios"
              placeholder="Nombre, identificación, usuario o celular"
              autocomplete="off"
            />
          </div>
          <p id="resultado-busqueda" class="search-result" role="status">
            ${this.app.banco.clientes.length} cliente(s)
          </p>
        </div>
        <p id="sin-resultados" class="empty" hidden>
          No encontramos clientes con esos datos.
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
              ${this.app.banco.clientes
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
          ${this.app.formularios.camposCliente(editado)}${editado ? '<p class="help">La contraseña se cambia desde el perfil, verificando la clave actual.</p>' : this.app.formularios.camposClave()}
          <div class="actions">
            <button type="submit">
              ${editado ? "Guardar cambios" : "Crear usuario"} ↗</button
            >${editado ? '<button type="button" class="outline" data-accion="nuevo-usuario">Cancelar edición</button>' : ""}
          </div>
        </form>
      </section>`;
  }
}

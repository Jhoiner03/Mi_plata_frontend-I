"use strict";

/* Punto de entrada. Las dependencias se cargan antes desde index.html.
 * Prueba: ana / Ana123 y luis / Luis123. Los datos siguen en localStorage.
 * No representa autenticación bancaria real. */
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

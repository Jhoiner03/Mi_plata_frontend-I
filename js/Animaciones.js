"use strict";

// Animaciones pequeñas de interfaz, sin cambiar los datos financieros.
class Animaciones {
  constructor() {
    this.entrada = null;
    this.frameMeta = null;
  }

  movimientoReducido() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  mostrarVista(elemento) {
    this.cancelar();
    if (this.movimientoReducido()) return;
    this.entrada = elemento.animate(
      [
        { opacity: 0.35, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
  }

  animarMeta(panel) {
    if (!panel) return;
    const barra = panel.querySelector('[role="progressbar"]');
    const numero = panel.querySelector("[data-porcentaje]");
    const destino = Number(barra.dataset.porcentaje);
    const actualizar = (valor) => {
      barra.style.width = `${valor}%`;
      numero.textContent = `${Math.round(valor)} %`;
    };
    if (this.movimientoReducido()) {
      actualizar(destino);
      return;
    }
    const inicio = performance.now();
    // EVENT LOOP: requestAnimationFrame programa un callback antes del próximo
    // repintado. La barra y el contador avanzan sin bloquear clics o escritura.
    const avanzar = (ahora) => {
      if (!panel.isConnected) return;
      const progreso = Math.min(1, (ahora - inicio) / 700);
      actualizar(destino * (1 - Math.pow(1 - progreso, 3)));
      if (progreso < 1) this.frameMeta = requestAnimationFrame(avanzar);
      else this.frameMeta = null;
    };
    this.frameMeta = requestAnimationFrame(avanzar);
  }

  cancelar() {
    this.entrada?.cancel();
    cancelAnimationFrame(this.frameMeta);
    this.entrada = null;
    this.frameMeta = null;
  }
}

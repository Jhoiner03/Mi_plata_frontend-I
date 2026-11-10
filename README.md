# Mi Plata

Proyecto académico de Frontend 1 con HTML, CSS y JavaScript orientado a objetos.
Esta versión tiene una nueva identidad visual y una pantalla independiente para
cada producto. No requiere instalar paquetes ni frameworks para ejecutarse.

## Abrir

Abre la carpeta en Visual Studio Code y ejecuta index.html directamente en un
navegador moderno, o utiliza Live Server. Usuarios ficticios de demostración:

- ana / Ana123
- luis / Luis123

## Navegación

Después de ingresar, el menú de productos abre estas rutas:

| Ruta | Pantalla | Operaciones |
| --- | --- | --- |
| #ahorros | Cuenta de ahorros | Resumen, consignar, retirar, transferir, movimientos y meta |
| #corriente | Cuenta corriente | Resumen, consignar, retirar, transferir y movimientos |
| #credito | Tarjeta de crédito | Resumen, comprar y financiar, pagar, transferir y movimientos |

Solo aparece un producto a la vez. Anterior y Siguiente recorren las páginas de
productos de manera circular. El enlace del producto actual vuelve a su resumen.
La URL antigua #panel sigue funcionando. Las rutas de productos requieren sesión;
al recargar, la sesión se cierra como en la versión anterior.

Perfil y Usuarios siguen disponibles en el menú. Este es un CRUD académico sin
roles de administrador.

## Cambios visibles

- Nuevo logo SVG integrado en index.html, sin imágenes externas.
- Nueva portada y menú lateral, con tonos blancos, azules y morados pastel.
- Un encabezado y una tarjeta visual dedicados a cada producto.
- Entrada suave de las pantallas y transiciones en botones y tarjetas visuales.
- Condiciones desplegables en el resumen del producto.
- Cotización con indicador de carga y actualización después de una pausa al escribir.
- Avisos con barra de tiempo, cuenta regresiva y cierre manual.
- Búsqueda de clientes por nombre, identificación, usuario o celular.
- Meta de ahorro con vista previa, porcentaje animado y almacenamiento por cliente.
- Historial con búsqueda, filtro por tipo y botón para mostrar cinco movimientos más.

## Recorrido para demostrar DOM traversing y event loop

1. Inicia sesión con Ana y pulsa Siguiente o Anterior. En Eventos.recorrerProductos,
   nextElementSibling y previousElementSibling recorren los enlaces del menú.
   firstElementChild y lastElementChild permiten volver al extremo.
2. Pulsa el texto o el icono de un producto. closest localiza el enlace contenedor;
   la aplicación cambia de ruta y muestra la pantalla correspondiente.
3. Abre Ver condiciones del producto. nextElementSibling encuentra el bloque que
   se despliega. El estado se comunica con aria-expanded.
4. En Ahorros, abre Mi meta de ahorro. Crea una meta de $2.000.000. Si el saldo es
   $1.000.000, verás un avance del 50 %. requestAnimationFrame actualiza la barra y
   el contador antes de los siguientes repintados durante aproximadamente 700 ms.
5. Escribe otro importe en la meta. Un setTimeout con debounce de 300 ms actualiza
   la vista previa cuando dejas de escribir. El formulario se obtiene con closest
   y sus campos se buscan dentro de él.
6. En Movimientos, escribe en la búsqueda o elige un tipo. Tras una pausa de 250 ms,
   se recorren tbody.children y se actualiza hidden en cada fila. Los nodos y los
   datos originales se conservan; no se elimina ningún movimiento.
7. Si hay más de cinco resultados, pulsa Ver 5 movimientos más. El botón muestra
   Mostrando más y queda desactivado durante el temporizador de 250 ms. closest
   identifica el panel y luego se muestran las siguientes filas coincidentes.
8. En Crédito, abre Comprar y financiar. Al escribir monto y cuotas, el indicador
   gira mientras se espera una pausa de 450 ms para actualizar la cotización.
   previousElementSibling localiza el contenedor de cuotas.
9. Realiza una operación válida. Un setInterval actualiza la cuenta regresiva
   según el reloj; un setTimeout cierra el aviso después de al menos seis segundos.
   La X y los avisos nuevos cancelan los temporizadores anteriores.
10. Abre Usuarios y busca Luis. Tras 300 ms se recorren las filas y sus celdas con
    children; solo queda visible el cliente coincidente y se actualiza el conteo.

Los temporizadores programan callbacks; no crean un hilo adicional. Sus tiempos
son mínimos y pueden aumentar si el navegador está ocupado. Las animaciones CSS
acompañan los cambios visuales; requestAnimationFrame coordina la animación del
avance con el repintado. Los cálculos y el guardado bancario siguen siendo síncronos.

Las tareas pendientes y las animaciones se cancelan al cambiar de vista o cerrar
sesión. Se respeta la preferencia del sistema para reducir movimiento.

## Cómo funcionan las metas

Hay una meta por cliente, con nombre y monto objetivo. Puedes crearla, editarla o
eliminarla. Su avance se calcula con el saldo actual de Ahorros y se limita al 100 %.
No aparta dinero, no programa transferencias y no genera intereses nuevos. Una
consignación o retiro cambia el saldo y, por tanto, el avance al consultar la meta.

Las metas se guardan bajo miPlata.metas.v1. Los clientes, saldos y movimientos
conservan la clave original miPlata.datos.v1 y su formato. Si se detectan metas
malformadas, no se sobrescriben los datos existentes.

## Archivos

| Archivo o carpeta | Responsabilidad |
| --- | --- |
| script.js | Iniciar la aplicación y manejar errores de arranque |
| js/utilidades.js | Validaciones, constantes y formato de valores |
| js/modelos/ | Cliente, Cuenta y sus tres productos |
| js/servicios/Banco.js | Autenticación, CRUD, operaciones y persistencia bancaria |
| js/servicios/MetasAhorro.js | Validar y guardar la meta de cada cliente |
| js/Aplicacion.js | Estado, rutas y coordinación de vistas |
| js/Eventos.js | Escuchar eventos y dirigir cada interacción |
| js/Animaciones.js | Transición de vistas y progreso animado |
| js/vistas/Formularios.js | Campos reutilizables |
| js/vistas/VistaAcceso.js | Portada, ingreso y registro |
| js/vistas/VistaPanel.js | Menú y página individual de producto |
| js/vistas/VistaProductos.js | Operaciones, resumen e historial |
| js/vistas/VistaUsuarios.js | Perfil y gestión de clientes |
| js/vistas/VistaMetas.js | Meta y formulario de objetivo |
| style.css | Diseño, distribución adaptable y transiciones CSS |

Los scripts clásicos se cargan con defer en el orden de index.html. Se mantienen
clases sencillas, herencia en los productos y composición para coordinar la interfaz.

## Instalar en tu carpeta conectada a GitHub

1. Guarda un respaldo de tu carpeta original.
2. Descomprime este ZIP en una ubicación aparte.
3. Copia el contenido de la carpeta mi-plata dentro de tu carpeta original
   Mi_Plata/mi-plata. Reemplaza los archivos y copia la carpeta js completa.
4. Conserva la carpeta .git de tu proyecto. El ZIP entregado no incluye .git.
5. Abre la carpeta original en VS Code. Ejecuta index.html o usa Live Server.
   Si aparece el diseño anterior, recarga con Ctrl + F5.
6. Desde la terminal del proyecto, revisa git status antes de guardar cambios.

```bash
git add index.html style.css script.js js README.md
git commit -m "Crear paginas por producto y agregar metas e historial interactivo"
git push
```

Usa el mismo navegador y origen si quieres acceder a los datos anteriores.
Cambiar de archivo local a Live Server, de servidor o de puerto puede utilizar
un almacenamiento diferente.

Los diagramas UML y las historias de usuario incluidos son los documentos originales.
Todavía describen la versión inicial; las nuevas pantallas, clases de interfaz y
funciones de meta e historial se describen en este README.

## Referencias de estudio

- https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Execution_model
- https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- https://developer.mozilla.org/en-US/docs/Web/API/Element/nextElementSibling
- https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval

Este proyecto es un simulador educativo. Utiliza exclusivamente datos y contraseñas
ficticios; las credenciales se almacenan en el navegador para el ejercicio de clase.

## Validación de esta versión

Se comprobó la sintaxis de todos los JavaScript. En Chromium se probaron el inicio
local, las rutas independientes y protegidas, el ingreso, la persistencia de metas,
la animación del progreso, la consignación, el retiro con interés, el sobregiro,
la compra, el abono a tarjeta y las transferencias. También se verificaron los
filtros de clientes y movimientos, la conservación de filas, la visualización de
más resultados, el regreso al resumen y el modo de movimiento reducido.

Se revisaron 84 vistas entre los anchos de 320, 390, 768 y 1500 píxeles sin
desbordamiento horizontal de la página. Las tablas pueden desplazarse dentro
de sus contenedores en pantallas pequeñas. Las pruebas de MetasAhorro incluyen
validación de nombres y montos, aislamiento de clientes, fallo al guardar y
protección de datos malformados. No se incluyen dependencias de pruebas en el ZIP.

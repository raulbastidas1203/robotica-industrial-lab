# Robótica Industrial · Laboratorio

Ultima modificacion: 2026-10-02 10:42:35 -05

Web de aprendizaje basada en los materiales originales de las semanas 2 a 5.

Sitio: https://raulbastidas1203.github.io/robotica-industrial-lab/

## Qué incluye

- Modelos cinemáticos 3D de SCARA T3-401S, VT6L-901S y Agilus C4.
- Controles articulares, animación, marcos de referencia, posición, Euler ZYX, matrices DH y jacobianos geométricos.
- Cinemática inversa interactiva del SCARA: dos ramas y verificación del alcance y rangos didácticos.
- Los cuatro PDF originales y el código legible de los ocho cuadernos MATLAB, con figuras extraídas.
- Descarga de los originales `.mlx` y del código extraído `.m`.
- Enlaces para abrir archivos originales y una simulación SCARA añadida en MATLAB Online.
- Apuntes personales locales al navegador.

El tutor IA queda fuera de esta versión por decisión del usuario.

## Desarrollo local

```bash
npm ci
npm run dev
```

Vite informa la URL local. Para validar y compilar:

```bash
npm test
npm run build
```

`npm run materials` requiere Python con Pillow y Poppler (`pdftoppm`). Genera páginas WebP para el visor y vuelve a copiar los originales y extrae código/figuras desde los `.mlx`; no modifica los archivos fuente.

## Publicación

La publicación actual utiliza la rama `gh-pages` con el sitio compilado localmente. Esta vía evita la compilación personalizada de Actions, bloqueada por un problema de facturación de la cuenta. GitHub procesa después el despliegue nativo de Pages.

Para actualizar la web, después de guardar y subir los cambios de `main`:

```bash
npm run deploy:pages
```

El comando ejecuta las pruebas, compila y actualiza solo los archivos generados en una copia temporal de `gh-pages`, sin reescribir su historia. Comprobar el estado final de Pages antes de dar una actualización por publicada.

Se conserva un workflow manual alternativo; para usarlo una vez resuelto el acceso a Actions, cambiar Pages a publicación mediante GitHub Actions.
`GITHUB_PAGES=true` establece `/robotica-industrial-lab/` como ruta base. Para otro nombre de repositorio, actualizar `vite.config.js` y `REPO` en `src/main.jsx`.

## MATLAB Online

Los botones abren los archivos desde este repositorio en MATLAB Online; requieren una cuenta MathWorks. Abrir un archivo no lo ejecuta: pulsar Run. La disponibilidad de toolboxes depende de la cuenta/licencia.

`matlab/simular_scara.m` es una simulación adicional de base MATLAB con controles y animación; no requiere Robotics ni Symbolic Math Toolbox. Es un archivo distinto de los cuadernos originales. No se ha ejecutado en MATLAB durante el desarrollo de la web.

La función compartida `matlab/DHL.m` es compatible con la convención numérica del curso. Para un original que no incluya su propia función DHL, desde la raíz del repositorio:

```matlab
addpath('matlab')
```

Algunas funciones de los originales, como `tform2eul` y las operaciones simbólicas, pueden requerir toolboxes. La web conserva esos originales.

## Convenciones y límites

Longitudes en mm. Interfaz angular en grados; trigonometría y derivadas angulares en radianes. El SCARA usa desplazamiento firmado `d3`: z = d3. El cuaderno de semana 5 usa z = -d3, por lo que su columna jacobiana tiene el signo opuesto.

Agilus usa -theta1 en su primera transformación. El jacobiano web aplica ese signo al eje y a la columna angular; el original concatena z0 positivo. Esta discrepancia está explicada en la interfaz sin editar el original.

La orientación de SCARA se recalcula para cada rama inversa: theta4 = yaw - theta1 - theta2. Los rangos de los controles son didácticos, no límites certificados. No hay dinámica, detección de colisiones ni ejecución genérica de MATLAB en el navegador. La inversa web de los robots de seis ejes no está implementada; sus originales sí están disponibles.

## Comprobaciones

Las pruebas independientes verifican posición analítica de SCARA, reconstrucción de ambas ramas inversas, objetivos inválidos, ortonormalidad y jacobianos lineales/angular mediante diferencias finitas. Esto no sustituye una comparación ejecutada con MATLAB ni una revisión del profesor.

# Revisión matemática y funcional del laboratorio

Ultima modificacion: 2026-10-02 11:00:31 -05

## Resultado

Revisión completada para la implementación web. Las transformaciones DH, los signos de las variables, los jacobianos geométricos y la inversa SCARA coinciden con la convención de los cuadernos originales. La validación ejecutada utiliza Node y una referencia independiente en Python; todavía no se ha ejecutado MATLAB real.

## Evidencia reproducible

- `scripts/course_reference.py` lee directamente los `.mlx` originales, extrae las llamadas a DHL y compone `Rz * traslación * Rx`. No importa el motor JavaScript ni ejecuta MATLAB. Genera `tests/fixtures/course-reference.json` con 21 poses y el SHA-256 de cada fuente.
- `npm test`: 13 pruebas aprobadas. Incluyen 21 poses contra esa referencia, 560 reconstrucciones de inversa SCARA, diferencias finitas lineales y angulares en configuraciones iniciales/extremas/singulares, 112 reconstrucciones Euler y ciclos completos de animación.
- Los doce originales publicados son idénticos byte a byte a los archivos fuente. Los ocho códigos visibles coinciden con los `.m` extraídos; las imágenes y páginas del visor existen.
- `npm run build`: compilación correcta. Verificación visual y funcional local de resolución inversa, rechazo de objetivo fuera del alcance, limpieza de mensajes antiguos y pausa/reanudación.

## Convenciones confirmadas

1. SCARA semana 2: `z = d3`, columna prismática lineal `[0,0,1]`. Semana 5: `z = -d3`, derivada con signo contrario. El laboratorio explica la diferencia.
2. Agilus: la transformación inicial usa `-theta1`. La columna angular correcta para esa variable es `-z0`; la derivada numérica lo confirma. El original concatena `+z0`, aunque su parte lineal simbólica sí incorpora el signo. Los originales se conservan.
3. Inversa SCARA: `theta4 = yaw - theta1 - theta2` se calcula por separado para cada rama. Se verifica la pose completa, incluyendo orientaciones envueltas en múltiplos de 360°.
4. Euler ZYX: la reconstrucción funciona también en pitch = ±90°. En bloqueo se toma roll = 0 y se informa que la representación no es única.
5. Alcance SCARA geométrico: 50–400 mm. El límite didáctico de theta2 = ±150° restringe las soluciones aceptadas; el borde interior geométrico exige ±180° y produce advertencia. El jacobiano pierde rango planar con theta2 = 0 o ±180°.
6. Los límites articulares son didácticos, no límites certificados de fabricante. No se modelan colisiones ni dinámica.

## Correcciones de esta revisión

- La animación conserva su fase al pausar/reanudar y cambiar velocidad; restablecer articulaciones reinicia el tiempo.
- Se limpia el mensaje de éxito anterior al editar un objetivo o iniciar animación. Cambiar de rama detiene la animación.
- La pieza final dibujada sigue el eje local de la herramienta, en lugar de apuntar siempre hacia abajo en los robots de seis ejes.
- Se explicitan el orden Z/Y/X de Euler y la trayectoria: círculo XY con oscilación vertical, no un círculo espacial plano.
- Las explicaciones de los cuadernos inversos ya no afirman que el original comprueba sus soluciones. Se aclaran la rama única y la falta de controles de alcance/singularidades en el VT6L.
- La simulación MATLAB añadida conserva fase al pausar y evita bucles anidados de animación; se conservan las unidades de las etiquetas.

## Pendiente de MATLAB real

No se encontró un ejecutable MATLAB u Octave en el equipo. No se afirma haber ejecutado los scripts ni sus callbacks gráficos en MathWorks.

Se agregó `matlab/validar_modelos.m`, que compara las 21 poses y comprueba los jacobianos por diferencias finitas usando solo MATLAB base. El botón «Comprobar modelos en MATLAB» lo abre en MATLAB Online. Ejecutarlo con Run; luego ejecutar `matlab/simular_scara.m` y comprobar controles, pausa/reanudación y cierre durante animación. Los originales pueden requerir toolboxes.

El formato del enlace fue contrastado con la [documentación oficial de MathWorks](https://www.mathworks.com/help/matlab/matlab_env/open-github-repositories-in-matlab-online.html): abre/clona el repositorio y abre el archivo; no ejecuta automáticamente el script.

## Comandos

```bash
python3 scripts/course_reference.py
npm test
npm run build
npm run dev
```

Para publicar cambios guardados en `main`: `npm run deploy:pages`. La rama `gh-pages` contiene la compilación estática; comprobar el despliegue nativo de Pages antes de informar su publicación.

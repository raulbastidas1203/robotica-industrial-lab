# Revisión de Robótica Industrial para Astra

Ultima modificacion: 2026-10-02 10:42:35 -05

## Objetivo

Revisar la exactitud matemática y didáctica de la web implementada en este proyecto, preservando los originales del profesor.

## Archivos principales

- `src/kinematics.js`: DH, cinemática directa de tres robots, jacobiano geométrico y cinemática inversa SCARA.
- `tests/kinematics.test.js`: comprobaciones con diferencias finitas de posición y rotación; reconstrucción inversa de ambas ramas.
- `src/RobotScene.jsx`: modelo 3D generado desde las transformaciones; el pedestal SCARA es una elevación visual de 200 mm.
- `src/main.jsx`: interfaz, materiales, convenciones, lectura de código y enlaces MATLAB Online.
- `scripts/extract_materials.py`: extracción sin modificar originales.
- `matlab/simular_scara.m`: simulación adicional MATLAB. Pendiente de ejecutar en una sesión MATLAB real.

## Puntos que merecen revisión

1. El SCARA de semana 2 usa d3 firmado y el de semana 5 usa -d3. La interfaz explica esta diferencia y no mezcla las derivadas.
2. En Agilus, la primera transformación usa -theta1. La web aplica -z0 al jacobiano geométrico; el original usa +z0 para Jw. Verificar esta corrección contra la parametrización del profesor.
3. Para cada rama inversa SCARA, recalcular theta4 desde yaw. El original calcula la orientación con los M01/M12 procedentes de la configuración original.
4. Revisar la convención Euler ZYX y el caso de bloqueo de cardán.
5. Comprobar la equivalencia con MATLAB en configuraciones numéricas y singularidades; los tests actuales son independientes de MATLAB.
6. No extender los rangos didácticos como si fueran límites físicos del fabricante.

## Alcance entregado

Los tres robots tienen directa, animación y jacobiano. Solo SCARA tiene inversa interactiva. La web es estática y se publica en GitHub Pages desde la rama `gh-pages` compilada localmente. El workflow personalizado de Actions no arrancó por un bloqueo de facturación; se conserva como alternativa manual. `npm run deploy:pages` actualiza la rama publicada. El tutor IA se excluye por petición del usuario. Los scripts originales siguen sin animación; la simulación MATLAB adicional es independiente.

## Validar

```bash
npm ci
npm test
npm run build
npm run dev
```

Revisar desktop/móvil, los doce materiales y los enlaces externos. Evitar introducir un tutor o servicios de pago sin una solicitud del usuario.

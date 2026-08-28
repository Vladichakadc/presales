# Manual de uso — Dimensionadores y BOM

El manual para el usuario final (no técnico) de las seis páginas de dimensionamiento y del
generador de BOM. Cubre el recorrido común (tráfico → perfil → equipo recomendado → BOM →
cotizador), la selección de equipo a fondo — el desplegable, las insignias, "Volver al
recomendado" — y lo particular de cada fabricante.

- **`manual.html`** — la fuente. Una página normal, con la misma paleta y tipografías que la
  propia aplicación (Barlow / Barlow Condensed / IBM Plex Mono).
- **`fonts/`** — esas tipografías, vendidas localmente. Chromium no confía en el certificado
  del proxy de salida de este entorno aunque `curl` sí, así que la generación no depende de
  la red — ver la cabecera de `scripts/generar-manual-usuario.js`.
- **`Manual de uso - Dimensionadores y BOM.pdf`** — el resultado, lo que se entrega.

## Editar el manual

Edita `manual.html` y corre:

```
npm run manual
```

Regenera el PDF en el sitio. No hace falta tocar nada más.

# Plan — Fase 6: deduplicar catálogo SKU, precios de soporte desde el txt, panel 4 a la izquierda

Petición del dueño (2026-09-13), con `Precios Aruba.txt` subido de nuevo:
1. Lista de materiales: se duplican números de parte y hay SKU sin valor — analizar de dónde
   sale el SKU sin valor y corregir.
2. Soporte «Foundational Care 24x7 / NBD HW» sale «— / consultar»: buscar el SKU y el valor
   en la lista de precios txt de Aruba y cablearlos.
3. «4 · Equipo y cotización» vuelve a la columna izquierda, debajo de «3 · Funciones
   adicionales».

Reglas: privacidad del txt (solo SKU, descripción, List Price, fecha, PLC status; NUNCA
nombre del distribuidor, PA, net price ni descuento; el txt vive en privado/ gitignored);
PENDIENTES.md al cerrar; 233 tests + eslint; E2E Chromium; commit en español.

## Etapas
- E1 ✓ Análisis duplicados: origen del grupo «Otras variantes de hardware» (merge de
  variantes del catálogo de modelos en cargarCatalogoSku) y contraste con el txt:
  ¿esas variantes (S3N71A, TAA, NAL, FIPS…) tienen List Price en el txt?
- E2 ✓ Análisis soporte: localizar en el txt los SKU de Foundational Care (24x7, NBD) por
  modelo/variante; decidir mapeo modelo → SKU de care por término (1/3/5 años) si existe.
- E3 ✓ Fix catálogo: deduplicar/retirar variantes sin precio que duplican un modelo ya
  pedible con precio; si el txt da precio a alguna variante, integrarla con precio.
- E4 ✓ Fix soporte: cablear SKU + List Price de care en LICENSES/care tiers (procedencia
  documentada en comentario y cabecera de seed si aplica).
- E5 ✓ Layout: mover panel 4 a la columna izquierda bajo el panel 3.
- E6 ✓ Verificación: verificar (233 + eslint), E2E (dedup visible, soporte con SKU/precio,
  panel 4 bajo el 3), grep privacidad, humo Fortinet.
- E7 Commit + push + Railway + PENDIENTES.md + bundle v6. (en curso)

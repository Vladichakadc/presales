# Traspaso: fortiextender-figura-pagina

- **Tema:** Enseñar en la página de Fortinet la figura del FortiExtender elegido, con su leyenda (sigue al PR #172)
- **Rama:** claude/fortiextender-figura-pagina
- **Cuenta:** (no consta)
- **Estado:** reservado
- **Actualizado:** 2026-11-10 13:08
- **Archivos que toca:** public/js/dimensionador-fortinet-fortigate.js, public/js/ficha.js, test/e2e/e2e-fortinet-wifi-celular.js
- **Siguiente paso:** fusionar el #172 (datos y figuras), traer main a esta rama y abrir el PR

## Encargo del dueño

«Enfócate a mejorar FortiWiFi y FortiExtender […] gráficos actualizados de los equipos» (2026-11-10): enseñar en la página las figuras que trae el PR #172.

## Hecho

- `figuraExtender` en la página, `FICHA.tablaLeyenda` expuesta y la e2e de Wi-Fi y celular ampliada.

## Falta

- Traer main con el #172 y abrir el PR.

## Decisiones y hallazgos


- El Excel no la lleva: «Fotos del equipo» es de un solo modelo (el FortiGate); llevar dos pide tocar `bom.js`.

## Verificación

- eslint limpio. La e2e corre en CI (aquí no hay Playwright instalado).

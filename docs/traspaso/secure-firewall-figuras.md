# Traspaso: Secure Firewall, figuras y ficha en el dimensionador Cisco (F2 y F3)

- **Tema:** las figuras oficiales de los Cisco Secure Firewall y su ficha completa en el dimensionador Cisco cuando se propone el firewall dedicado
- **Rama:** claude/secure-firewall-figuras
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S92WvujFK1KCusavSu)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 08:55
- **Archivos que toca:** public/data/cisco-vistas-equipos.json, public/img/equipos/cs-sf*.webp, server/seed/legacyData/cisco.js (SECURE_FIREWALL.fichas), public/js/dimensionador-cisco-catalyst8k.js, public/dimensionador-cisco-catalyst8k.html, test/cisco-vistas-equipos.test.js, test/cisco-leyendas.test.js, test/secure-firewall-catalogo.test.js, test/e2e/e2e-secure-firewall-ficha.js
- **Siguiente paso:** CI verde (verificar y pantallas, con la batería e2e-secure-firewall-ficha), commit de cierre con el número del PR y fusión

## Encargo del dueño

«Sí, ficha completa»: el Cisco Secure Firewall 1200/3100/4200 entra al catálogo con ficha completa.
F1 (portal y calculadora) fue el PR #87; esta rama es F2 (figuras) y F3 (la ficha en el dimensionador).

## Hecho

- Figuras: WebP sin pérdida (solo recortado el margen blanco uniforme) y previas con pérdida, con su pie literal; la 1200 sin trasera publicada (`rearNota`).
- Ficha del firewall dedicado (`#fichaFw`, `pintarFichaFw`): desplegable de los que cumplen, cifras con su base, escala, hardware, alimentación, figuras y enlace a la ficha oficial; elegir otro cambia el BOM; ciclo de vida declarado sin respaldo.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- La 3100 y la 4200 dan una sola figura de la serie para todos sus modelos, con módulos de red montados: el pie lo dice.
- El firewall elegido a mano no viaja en el enlace (no es un campo de `CAMPOS_ENLACE`): queda como pendiente.

## Verificación

- Local: pruebas de figuras y de Secure Firewall en verde; el resto, las mismas fallas por dependencias que `main`. El e2e corre en CI.

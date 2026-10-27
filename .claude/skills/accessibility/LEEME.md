# accessibility — procedencia, y lo que aquí aplica y lo que no

Instalada el **2026-10-27** con el encargo del dueño «ejecuta las mejoras propuestas» (la mejora
propuesta al instalar ECC: revisar sus skills y copiar solo las que encajen con este stack).
Desde <https://github.com/affaan-m/ECC>, commit **`25278e7`** (26-oct-2026), licencia MIT
(Copyright (c) 2026 Affaan Mustafa). `SKILL.md` es copia literal de `skills/accessibility/SKILL.md`
del upstream, sin tocar una línea.

## Por qué esta y no las otras 310

De las 311 skills de ECC, casi todas describen otro stack (React, Next.js, Django, Laravel,
Spring, Swift, Kotlin…) o el propio arnés de ECC: aquí empujarían el trabajo hacia una
arquitectura que no existe. Se miraron de cerca las que podían encajar:

| Skill de ECC | Decisión | Por qué |
|---|---|---|
| `accessibility` | **Se copia** | WCAG 2.2 sobre HTML y ARIA nativos, sin framework. Cubre lo que la batería de axe no mide (ver abajo). |
| `frontend-a11y` | No | Escrita para React y Next.js. |
| `regex-vs-llm-structured-text` | No | Su idea (lo determinista primero, el modelo para el resto) ya es la regla de la sincronización (`contraste.js` antes que la IA); sus ejemplos son de Python. |
| `prompt-caching-strategy`, `cost-aware-llm-pipeline` | No | Las cubre la skill `claude-api`, que es la fuente vigente de modelos, precios y caché; estas mezclan proveedores y pueden quedarse viejas. |
| `architecture-decision-records` | No | Crearía `docs/adr/` en paralelo a `docs/decisiones-*` y a `PENDIENTES.md`. |
| `cisco-ios-patterns`, `network-*`, `netmiko-ssh-automation` | No | Operan routers (CLI, SSH); este repositorio dimensiona y cotiza, y la plantilla de CLI se descartó a propósito. |

## Lo que aplica aquí y lo que no

- **Aplica**: las páginas son HTML y JS a mano (`public/*.html`, `public/js/*.js`), así que la
  columna «Web (HTML/ARIA)» de la skill es la que cuenta. Las secciones de **iOS (SwiftUI)** y
  **Android (Compose)** no aplican: aquí no hay aplicaciones nativas.
- **Lo que manda es la prueba**: `test/e2e/e2e-accesibilidad.js` pasa axe con las etiquetas
  `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa`, y el reflujo a 640 px. La skill añade criterios de
  **WCAG 2.2** que esa batería no mide (tamaño mínimo de objetivo de 24×24 px, SC 2.5.8; foco no
  tapado, SC 2.4.11; entrada redundante, SC 3.3.7): úsala para revisar una pantalla nueva, y si un
  criterio merece frenar, se convierte en una comprobación de esa batería (no en un script aparte).
- **Sin JavaScript en línea** (CSP `script-src 'self'`): los ejemplos de la skill son de marcado,
  pero cualquier manejador va por la delegación de eventos del script de la página.

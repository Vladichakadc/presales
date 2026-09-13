# Plan — Fase 10: sincronización total del módulo Aruba (reglas de diseño de arquitecto)

Instrucción del dueño (2026-09-13): «Analiza como un arquitecto en networking de Aruba e
integra tus observaciones en el dimensionador con el objetivo de ser lo más acertado y
preciso; todo el módulo de Aruba debe estar sincronizado para que cada función que se
active llame la licencia y calcule automáticamente; valida por web los ajustes necesarios
a nivel de diseño». Skill: vibecoding-general-swarm, Modo B. Aruba sigue siendo el piloto.

## Hipótesis de diseño a validar por web (F1) y luego codificar (F2-F3)

Cada función activable del formulario debe (a) llamar su licencia/SKU, (b) calcular su
cantidad, y (c) excluir o advertir combinaciones imposibles — sin intervención manual:

1. Boost es ADD-ON de la suscripción EdgeConnect: «no incluir suscripción» o «solo
   hardware» deben retirar Boost del BOM con aviso (hoy queda huérfano).
2. Dynamic Threat Defense (IDS/IPS) también es add-on de la suscripción: misma regla.
3. On-Premises (E-STU) exige Orchestrator auto-alojado: línea/nota «consultar» en el BOM.
4. On-Premises debe cambiar Boost a su variante on-prem (verificar que el motor ya lo hace).
5. HA 1+1 exige pareja idéntica: activar HA debería fijar qty=2 (o avisar si qty≠2).
6. EC-V es virtual: sin SKU de hardware ni Foundational Care HW — ocultar/declarar.
7. Tier de licencia por caudal del sitio (ya) — validar que nunca supere la capacidad del
   chasis recomendado (el filtro de candidatos ya descarta, pero el tier se calcula de
   needProc; confirmar coherencia).
8. Central de gateways: regla de deducción Foundation/Advanced documentada (hoy
   nivelAutoCentral — revisar su criterio contra la fuente oficial).
9. 9240: licencias perpetuas AAE — confirmar modelo de licenciamiento (¿lleva Central?).
10. Regla del 30% de Boost y tasas de flujos (80-100/150-200): contrastar con guías
    oficiales si existen; si no, quedan como regla de trabajo declarada del arquitecto.
11. SEMÁFORO DE DISEÑO en el BOM: sección «Revisión del diseño» con reglas declarativas
    (REGLAS_DISENO) verde/ámbar/rojo — el portal actúa de par técnico.

## Etapas
- F1 Investigación web (3 agentes paralelos): (A) EdgeConnect — Boost, DTD, Orchestrator
  on-prem, HA 1+1 oficial; (B) SD-Branch/Central — tiers Foundation/Advanced de gateway,
  AppRF, 9240 AAE; (C) sizing — flujos por usuario, headroom, Boost 30%, FEC overhead.
  Salida: brief validado con URLs oficiales; lo que no tenga fuente se declara «regla de
  trabajo del arquitecto».
- F2 Diseño de REGLAS_DISENO (declarativo, testeable) + mapa función→licencia→cálculo.
- F3 Implementación motor + BOM (semáforo) + auto-exclusiones + autosync HA/qty/EC-V.
- F4 Tests nuevos (reglas de sincronía + semáforo).
- F5 Verificación: npm run verificar, E2E Chromium, cero errores consola, humo Fortinet.
- F6 Cierre: COMMIT TEMPRANO tras verificar, push, Railway /salud ×3, PENDIENTES.md,
  bundle v10, informe con pendientes + mejora.

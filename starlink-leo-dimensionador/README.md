# Dimensionador empresarial Starlink LEO para Presales

Módulo autónomo de preventa para estimar la demanda de datos prioritarios, la capacidad simultánea y los prerrequisitos físicos de una sede que utilizará Starlink Business. El resultado recomienda una familia de plan, número de líneas, tipo de terminal, arquitectura de continuidad y una lista base de materiales.

Fecha de investigación: **23 de septiembre de 2026**.

## Ejecución

La página no requiere compilación ni dependencias externas:

1. Abra `index.html` directamente en un navegador moderno; o
2. publique la carpeta en cualquier servidor web estático.

Para una prueba local puede ejecutarse:

```bash
python3 -m http.server 8080 --directory starlink-leo-dimensionador
```

Después abra `http://localhost:8080`.

## Principio de dimensionamiento

El módulo evita equiparar “cantidad de usuarios” con “tamaño del plan”. Evalúa cinco dimensiones independientes:

1. **Volumen mensual:** convierte las aplicaciones en GB/mes y aplica crecimiento, reserva y sobrecarga de protocolo.
2. **Demanda simultánea:** suma el pico de descarga y subida de cada carga activa.
3. **Capacidad por terminal:** contrasta el pico con un perfil conservador, de referencia o medido en la sede y limita la utilización de diseño.
4. **Viabilidad física:** condiciona o bloquea la recomendación por obstrucciones, energía, ambiente y movilidad.
5. **Continuidad:** recomienda enlace único, dos líneas Starlink o una arquitectura híbrida con un operador de dominio de falla diferente.

La ecuación general es:

```text
Demanda proyectada = demanda base
                    × factor de rol del enlace
                    × (1 + sobrecarga de protocolo)
                    × (1 + crecimiento)
                    × (1 + reserva de ingeniería)
```

Para un enlace de respaldo, el volumen mensual se pondera por las horas probables de contingencia, pero la demanda pico se conserva completa, ya que el failover debe soportar la operación real.

## Catálogo precargado

Los precios se obtuvieron del documento público de transición de planes Priority de Starlink y se mantienen editables desde la interfaz. No constituyen una cotización y pueden variar por dirección, impuestos, hardware, disponibilidad o condiciones contractuales.

| Ámbito | Paquete | Cuota | Referencia COP/mes |
|---|---:|---:|---:|
| Local | Local Priority 50 GB | 50 GB | 203.000 |
| Local | Local Priority 1 TB | 1.000 GB | 905.000 |
| Local | Local Priority 2 TB | 2.000 GB | 1.685.000 |
| Local | Local Priority 6 TB | 6.000 GB | 4.805.000 |
| Global | Global Priority 50 GB | 50 GB | 1.300.000 |
| Global | Global Priority 1 TB | 1.000 GB | 5.980.000 |
| Global | Global Priority 5 TB | 5.000 GB | 26.780.000 |
| Global | Global Priority 10 TB | 10.000 GB | 52.780.000 |
| Global | Global Priority 15 TB | 15.000 GB | 78.780.000 |
| Global | Global Priority 25 TB | 25.000 GB | 130.780.000 |

La herramienta obliga a marcar si los valores fueron verificados en el portal o en una cotización vigente. Mientras no se confirme, el resultado se clasifica como condicionado.

## Variables incluidas

- Usuarios totales, concurrencia, jornada, crecimiento y reserva.
- Rol del enlace: principal, respaldo o temporal.
- Criticidad y disponibilidad objetivo.
- Ofimática/SaaS, videoconferencia, VoIP, streaming, CCTV, backups, transferencias, IoT, invitados y carga manual.
- Perfiles diferenciados de subida y descarga.
- Capacidad por terminal y utilización máxima de diseño.
- Obstrucciones, energía, entorno, movilidad y autonomía.
- Área, pisos y densidad de muros para estimación preliminar de AP.
- Arquitectura de continuidad y diversidad de operador.
- Catálogo comercial editable y fecha de vigencia.

## Reglas técnicas relevantes

- La selección del plan depende de la cuota mensual; el número de terminales depende del pico de descarga/subida y de la resiliencia.
- El perfil inicial usa el extremo inferior publicado de **50 Mbps de descarga y 10 Mbps de subida**, con un umbral configurable de utilización.
- Una medición alta aislada no se trata como garantía. Debe confirmarse con pruebas repetidas en hora pico y con la herramienta de disponibilidad/velocidad por ubicación.
- Starlink debe contar con un campo de visión despejado; una obstrucción identificada produce un estado **No-Go**.
- Para objetivos de 99,9% o misión crítica, el modo automático propone un enlace de operador diverso. Dos terminales de la misma constelación no eliminan fallas correlacionadas.
- El **Performance Kit** se recomienda para movilidad, ambiente exigente, misión crítica, alta disponibilidad, multienlace o mayor escala. El **Standard 4 X** queda para sedes fijas de menor riesgo.
- El Starlink Mini no se utiliza como opción empresarial del motor, porque la documentación pública excluye el SLA indicado para planes Priority cuando se usa dicho kit.
- La capacidad Wi-Fi del router Starlink no sustituye un diseño LAN empresarial. El BOM propone firewall, VLAN, QoS, AP empresariales, switch PoE, UPS, puesta a tierra y monitoreo.

## Integración con Presales

La solución es deliberadamente independiente de frameworks. Para integrarla en la aplicación existente se recomiendan dos alternativas:

### Integración rápida

- Copiar `index.html`, `styles.css` y `app.js` al directorio público.
- Incorporar la ruta al menú de dimensionadores.
- Sustituir los colores de `:root` en `styles.css` por los tokens de diseño institucionales.
- Conectar “Generar informe” con el generador PDF/Word del portal, si existe.

### Integración por componentes

- Extraer el formulario y el panel de resultados como componentes del framework utilizado por Presales.
- Mantener `calculateScenario()` como función pura de dominio.
- Trasladar el catálogo a una tabla administrable con `effective_from`, `effective_to`, país, moneda, impuestos, fuente y estado de validación.
- Exponer un endpoint como `POST /api/sizing/starlink` que reciba el escenario y devuelva recomendación, trazabilidad, catálogo aplicado y versión de reglas.
- Registrar el escenario y el resultado juntos para garantizar auditabilidad.

La aplicación publica una API mínima en navegador:

```javascript
window.StarlinkDimensioner.getState();
window.StarlinkDimensioner.getResult();
window.StarlinkDimensioner.getCatalogs();
window.StarlinkDimensioner.calculate(state, catalogs);
```

## Contrato de datos recomendado para backend

```json
{
  "scenarioId": "uuid",
  "country": "CO",
  "currency": "COP",
  "role": "primary",
  "scope": "local",
  "users": 80,
  "concurrencyPct": 70,
  "applications": [],
  "siteValidation": {
    "obstruction": "clear",
    "speedProfile": "measured",
    "downMbps": 110,
    "upMbps": 18,
    "measuredAt": "2026-09-23T16:00:00-05:00"
  },
  "commercialCatalogVersion": "CO-2026-09-23",
  "rulesVersion": "starlink-leo-1.0.0"
}
```

El backend debe recalcular el resultado; no debe confiar en cifras enviadas por el navegador. La respuesta debería incluir `selectedPlan`, `requiredCapacity`, `terminalCount`, `hardware`, `bom`, `warnings`, `blockers`, `confidence`, `calculationTrace` y `sources`.

## Casos de uso incluidos

La interfaz contiene cuatro escenarios reproducibles:

- Oficina rural de 25 usuarios.
- Sucursal crítica de 80 usuarios.
- Respaldo corporativo de 120 usuarios.
- Operación industrial con CCTV e IoT.

Los casos permiten verificar que el motor diferencia cuota, pico, subida, respaldo y condiciones físicas.

## Pruebas

El proyecto incorpora pruebas reproducibles del motor, catálogo, estados No-Go y estructura responsive:

```bash
node tests/run-tests.cjs
```

La batería incluida valida, entre otros aspectos, la selección escalonada de 50 GB/1 TB/2 TB/6 TB, el desbordamiento del catálogo, el cálculo particular de un enlace de respaldo, el número de terminales por capacidad, la obligación de diversidad para misión crítica y la restricción de subida provocada por CCTV.

## Fuentes oficiales principales

- [Starlink Business Colombia](https://starlink.com/co/business)
- [Priority Plan Transition](https://starlink.com/public-files/Priority_Plan_Transition.pdf)
- [Starlink Service Plan Descriptions](https://starlink.com/legal/documents/DOC-1728-44881-79)
- [Starlink Fair Use Policy](https://starlink.com/legal/documents/DOC-1722-29027-68)
- [Performance Kit Specifications](https://starlink.com/public-files/specification_sheet_performance.pdf)
- [Standard 4 X Specifications](https://starlink.com/public-files/specification_sheet_standard.pdf)
- [Zoom bandwidth requirements](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060748)
- [YouTube system and speed requirements](https://support.google.com/youtube/answer/78358?hl=es)
- [Eutelsat OneWeb LEO](https://www.eutelsat.com/satellite-network/oneweb-leo-constellation)
- [Amazon Leo enterprise terminals](https://www.aboutamazon.com/news/amazon-leo/amazon-leo-satellite-internet-ultra-pro)

## Límites de uso

El dimensionador es un apoyo técnico-comercial y no reemplaza:

- disponibilidad y velocidad por dirección;
- estudio de obstrucciones en la ubicación definitiva;
- prueba sostenida en hora pico;
- levantamiento RF y LAN;
- análisis eléctrico y de puesta a tierra;
- validación regulatoria del uso móvil o marítimo;
- cotización oficial, impuestos, contrato y SLA aplicable.

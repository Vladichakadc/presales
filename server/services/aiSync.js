const { Anthropic } = require('@anthropic-ai/sdk');
const xlsx = require('xlsx');

// Sin clave no hay analisis: se falla cerrado, igual que el servidor con AUTH_PASSWORD.
//
// Aqui vivio un simulacro que, sin ANTHROPIC_API_KEY, devolvia propuestas inventadas con
// apariencia legitima — incluido un "FortiGate 9000F" que no existe, con precio y specs
// verosimiles. Servia para ver el panel funcionando sin pagar la API, y era exactamente el
// modo de fallo que este catalogo tiene prohibido: un dato falso con pinta de verdadero.
// Se retiro. La ausencia de clave se declara con un error propio para que la ruta responda
// 503 explicandolo, en vez de 500 generico.
class SinClave extends Error {
  constructor() {
    super('Falta ANTHROPIC_API_KEY: la sincronización con IA no puede analizar nada sin ella.');
    this.code = 'SIN_CLAVE';
  }
}

let cliente = null;
function anthropicCliente() {
  if (!process.env.ANTHROPIC_API_KEY) throw new SinClave();
  if (!cliente) cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cliente;
}

async function analyzeCatalog(vendor, catalogData, file) {
  const anthropic = anthropicCliente();

  const { equipment, licenses, supportTiers, parts } = catalogData;

  let prompt = `
Eres un experto en preventa de redes e infraestructura, especializado en ${vendor}.
Tu misión es realizar una revisión exhaustiva del catálogo completo (equipos, precios, licencias, soporte y SKUs) y actuar con conocimiento profundo.
1. Equipos: identifica modelos existentes cuyas métricas técnicas (fw, ips, vpn, etc.) estén desactualizadas según las hojas de datos oficiales más recientes, y modelos IMPORTANTES que falten por completo en el catálogo.
2. Precios: identifica precios de equipos existentes que estén desactualizados según listas de precio o el documento adjunto.
3. Licencias/software: identifica bundles de licencia (ej. FortiGuard) desactualizados o faltantes.
4. Soporte: identifica niveles de soporte (ej. FortiCare) desactualizados o faltantes.
5. SKUs/partes: identifica SKUs de partes/accesorios desactualizados o faltantes.

Al proponer un valor numérico para un campo que ya existe en el catálogo, usa el mismo formato/unidad que ya usa ese campo (no mezcles "Gbps" con Mbps, por ejemplo). Al decidir si algo es un cambio real, compara el valor semántico, no el formato exacto del texto.
`;

  if (file) {
    prompt += `
[ATENCIÓN: Se ha proporcionado un archivo adjunto (Datasheet, Excel o Referencia).
DA PRIORIDAD ABSOLUTA a extraer la información exacta de las especificaciones y los modelos presentes en el documento adjunto.
Ignora tu conocimiento previo si contradice al documento.]
`;
  }

  prompt += `
REGLA CRÍTICA DE CERO DUPLICADOS:
- Compara los valores que vas a sugerir con el "Catálogo Actual" proveído más abajo.
- Si el valor que propones para un registro ya es EXACTAMENTE IGUAL (en valor semántico) al que tiene el Catálogo Actual, **NO LO DEVUELVAS**.
- Solo devuelve un objeto si representa un cambio real (UPDATE) o un registro que definitivamente NO existe en el catálogo actual (NEW).
- Si no hay diferencias reales, devuelve un arreglo vacío: []

Devuelve EXCLUSIVAMENTE un JSON con un array de objetos con esta estructura exacta:
[
  {
    "target": "product" | "license" | "supportTier" | "part",
    "type": "UPDATE", // o "NEW" si el registro no existe
    "id": "Modelo exacto del equipo (target=product) o código exacto (target=license/supportTier/part)",
    "field": "Nombre del campo a actualizar si type=UPDATE ('price' para precio de un equipo, o el nombre del campo del specs/registro). Si type=NEW, pon 'N/A'",
    "oldValue": "Valor viejo (si es NEW, pon 'N/A')",
    "newValue": "Valor nuevo. Estructura según el caso:
      - UPDATE de un campo simple de equipo (target=product, field distinto de 'price'): el valor escalar nuevo.
      - UPDATE de precio de equipo (target=product, field='price'): objeto JSON stringificado {\\"priceDisplay\\":\\"~ $1,800\\",\\"priceNumeric\\":1800}.
      - NEW de equipo (target=product): objeto JSON stringificado con specs base (fw, ips, seg, etc.) y opcionalmente priceDisplay/priceNumeric.
      - NEW de licencia (target=license): objeto JSON stringificado {\\"name\\":...,\\"description\\":...}.
      - NEW de soporte (target=supportTier): objeto JSON stringificado {\\"name\\":...,\\"sla\\":...,\\"description\\":...}.
      - NEW de SKU/parte (target=part): objeto JSON stringificado {\\"sku\\":...,\\"description\\":...}.
      - UPDATE de licencia/soporte/parte: el valor escalar nuevo para el campo indicado en 'field'.",
    "reason": "Por qué se sugiere este cambio",
    "sourceUrl": "https://www.ejemplo.com/datasheet.pdf (URL oficial de donde sacaste la info)"
  }
]
No devuelvas texto fuera del JSON. Si no encuentras mejoras, devuelve [].

Catálogo Actual:
${JSON.stringify({ equipos: equipment, licencias: licenses, soporte: supportTiers, skus: parts }, null, 2)}
`;

  try {
    const messages = [];

    if (file) {
      // `file.tipo` lo decide la ruta leyendo la firma del contenido (%PDF, PK..), no el
      // mimetype que declara el navegador: ese lo controla quien sube el archivo.
      const isExcel = file.tipo === 'xlsx' || file.tipo === 'csv';

      if (isExcel) {
        // Parse excel to CSV text
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const csvText = xlsx.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);

        prompt = `CONTENIDO DEL EXCEL / CSV ADJUNTO:\n${csvText}\n\n` + prompt;
        messages.push({ role: 'user', content: prompt });
      } else {
        const media_type = file.tipo === 'txt' ? 'text/plain' : 'application/pdf';

        messages.push({
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: media_type,
                data: file.buffer.toString('base64')
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        });
      }
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8192,
      messages: messages,
    });

    if (response.stop_reason === 'refusal') {
      console.warn('[AI Sync] Claude rechazó la solicitud (stop_reason: refusal)');
      return [];
    }

    // response.content puede incluir bloques 'thinking' antes del texto (Opus 5 piensa por defecto) — buscar el bloque de texto en vez de asumir que es el primero
    const textBlock = response.content.find((b) => b.type === 'text');
    const content = textBlock ? textBlock.text : '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (err) {
    console.error('[AI Sync] Error llamando a Claude:', err);
    throw new Error('No se pudo analizar el catálogo con IA.');
  }
}

module.exports = { analyzeCatalog, SinClave };

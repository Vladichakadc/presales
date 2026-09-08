'use strict';
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

// La clave ESTÁ puesta pero la API la rechaza (401/403). Es un caso distinto de SinClave y
// merece su propio error: sin esto, un `invalid x-api-key` se disfrazaba de «Error analizando
// con IA» genérico (500) y quien lo veía no tenía forma de saber que el problema es la clave,
// no el catálogo ni el documento. Mismo espíritu que SinClave: fallar cerrado y DECIR por qué.
class ClaveInvalida extends Error {
  constructor() {
    super('La ANTHROPIC_API_KEY configurada no es válida (la API respondió 401). '
      + 'Revísala en las variables del servicio: que sea una clave de API vigente (sk-ant-api…), '
      + 'sin espacios ni saltos de línea al copiarla, y del mismo espacio de trabajo con saldo.');
    this.code = 'CLAVE_INVALIDA';
  }
}

// La API respondió con límite de uso (429). Es transitorio, no un error de configuración, así
// que se distingue para que la ruta devuelva 429 y quien lo vea sepa que basta reintentar.
class LimiteIA extends Error {
  constructor() {
    super('La API de IA respondió con límite de uso (429). Espera unos segundos y reintenta.');
    this.code = 'LIMITE_IA';
  }
}

// Traduce el error crudo del SDK al error propio que la ruta sabe convertir en un HTTP claro.
// Se decide por el código de estado y no por `instanceof`, que es frágil a través de la
// frontera del módulo (la clase concreta del SDK puede variar entre versiones/envoltorios).
function errorDeIA(err) {
  const status = err && err.status;
  if (status === 401 || status === 403) return new ClaveInvalida();
  if (status === 429) return new LimiteIA();
  return new Error('No se pudo analizar el catálogo con IA.');
}

const MODELO = 'claude-opus-5';
const MAX_TOKENS = 32000;

let cliente = null;
function anthropicCliente() {
  if (!process.env.ANTHROPIC_API_KEY) throw new SinClave();
  if (!cliente) cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cliente;
}

// ESQUEMA DE SALIDA. Antes la respuesta se sacaba con `content.match(/\[[\s\S]*\]/)` sobre
// texto libre: bastaba que el modelo escribiera una frase con un corchete para romper el
// analisis entero, y no habia nada que garantizara que los campos fueran los esperados. Con
// output_config.format la API obliga al modelo a devolver exactamente esta forma, asi que el
// parser deja de ser una heuristica.
//
// `additionalProperties: false` y `required` completos van a proposito: un cambio con un
// campo de mas o de menos es un cambio que el importador no sabria aplicar, y es mejor que
// falle la peticion a que llegue a medias.
const ESQUEMA_CAMBIOS = {
  type: 'object',
  properties: {
    cambios: {
      type: 'array',
      description: 'Cambios propuestos. Vacío si el catálogo ya está al día.',
      items: {
        type: 'object',
        properties: {
          target: { type: 'string', enum: ['product', 'license', 'supportTier', 'part'] },
          type: { type: 'string', enum: ['UPDATE', 'NEW'] },
          id: { type: 'string', description: 'Modelo exacto (target=product) o código exacto (resto).' },
          field: { type: 'string', description: "Campo a actualizar; 'price' para el precio de un equipo. 'N/A' si type=NEW." },
          oldValue: { type: 'string', description: "Valor actual del catálogo. 'N/A' si type=NEW." },
          newValue: { type: 'string', description: 'Valor nuevo. Objeto JSON serializado cuando el destino lo requiere (precio, alta de registro).' },
          reason: { type: 'string', description: 'Por qué se propone, citando el documento.' },
          sourceUrl: { type: 'string', description: 'URL oficial de la fuente, o cadena vacía si no la hay.' },
        },
        required: ['target', 'type', 'id', 'field', 'oldValue', 'newValue', 'reason', 'sourceUrl'],
        additionalProperties: false,
      },
    },
  },
  required: ['cambios'],
  additionalProperties: false,
};

// Las instrucciones son estables entre llamadas, asi que van en `system` y se cachean: el
// orden de render es tools -> system -> messages, y cachear un prefijo estable solo sirve si
// va delante. El catalogo (estable por fabricante) va al principio del primer mensaje, con
// su propio punto de cache; el documento adjunto y la pregunta van despues, porque cambian
// en cada llamada y invalidarian el prefijo si fueran antes.
const SISTEMA = `Eres un experto en preventa de redes e infraestructura. Revisas un catálogo interno de equipos de red y propones correcciones.

QUÉ BUSCAR
1. Equipos: modelos cuyas métricas técnicas (fw, ips, vpn, ipsec, etc.) estén desactualizadas frente a la hoja de datos oficial, y modelos importantes que falten.
2. Precios desactualizados frente a la lista de precios o el documento adjunto.
3. Bundles de licencia, niveles de soporte y SKUs de partes desactualizados o ausentes.

REGLAS QUE NO SE NEGOCIAN
- CERO DUPLICADOS: si el valor que ibas a proponer ya coincide semánticamente con el del catálogo, no lo devuelvas. Compara el valor, no el formato del texto.
- NUNCA INVENTES. Si no tienes una fuente para un dato, no lo propongas. Un SKU o un precio verosímil pero inventado es el peor resultado posible: este catálogo ya tuvo una vez un modelo inexistente con precio y specs creíbles, y por eso existe esta regla.
- Usa la misma unidad y formato que ya usa el campo (no mezcles Gbps con Mbps).
- Si no hay ningún cambio real, devuelve la lista vacía.

CÓMO SE ESTRUCTURA newValue
- UPDATE de un campo simple de equipo: el valor escalar nuevo, como texto.
- UPDATE de precio (field='price'): objeto JSON serializado {"priceDisplay":"~ $1,800","priceNumeric":1800}.
- NEW de equipo: objeto JSON serializado con las specs base y, si las hay, priceDisplay/priceNumeric.
- NEW de licencia: {"name":...,"description":...}. NEW de soporte: {"name":...,"sla":...,"description":...}. NEW de parte: {"sku":...,"description":...}.
- UPDATE de licencia, soporte o parte: el valor escalar nuevo.`;

function textoDelAdjunto(file) {
  // `file.tipo` lo decide la ruta leyendo la firma del contenido (%PDF, PK..), no el
  // mimetype que declara el navegador: ese lo controla quien sube el archivo.
  if (file.tipo === 'xlsx' || file.tipo === 'csv') {
    const libro = xlsx.read(file.buffer, { type: 'buffer' });
    return xlsx.utils.sheet_to_csv(libro.Sheets[libro.SheetNames[0]]);
  }
  return null;
}

async function analyzeCatalog(vendor, catalogData, file) {
  const anthropic = anthropicCliente();
  const { equipment, licenses, supportTiers, parts } = catalogData;

  const catalogo = JSON.stringify(
    { equipos: equipment, licencias: licenses, soporte: supportTiers, skus: parts }, null, 2,
  );

  // Primero lo estable (y cacheado), despues lo que cambia en cada llamada.
  const contenido = [
    {
      type: 'text',
      text: `Catálogo actual de ${vendor}:\n${catalogo}`,
      cache_control: { type: 'ephemeral' },
    },
  ];

  if (file) {
    const hoja = textoDelAdjunto(file);
    if (hoja !== null) {
      contenido.push({ type: 'text', text: `CONTENIDO DEL EXCEL/CSV ADJUNTO:\n${hoja}` });
    } else {
      contenido.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: file.tipo === 'txt' ? 'text/plain' : 'application/pdf',
          data: file.buffer.toString('base64'),
        },
      });
    }
    contenido.push({
      type: 'text',
      text: 'Hay un documento adjunto. Tiene prioridad absoluta sobre tu conocimiento previo: si lo contradice, manda el documento. Extrae de él las especificaciones exactas.',
    });
  }

  contenido.push({ type: 'text', text: `Revisa el catálogo de ${vendor} y devuelve solo los cambios reales.` });

  try {
    // Streaming porque un Product Matrix completo con max_tokens alto puede pasarse del
    // tiempo limite de una peticion normal. `finalMessage()` espera al mensaje completo.
    const stream = anthropic.messages.stream({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: contenido }],
      output_config: {
        format: { type: 'json_schema', schema: ESQUEMA_CAMBIOS },
      },
    });
    const response = await stream.finalMessage();

    if (response.stop_reason === 'refusal') {
      const motivo = response.stop_details && response.stop_details.category;
      console.warn(`[AI Sync] Claude declinó la solicitud${motivo ? ` (${motivo})` : ''}`);
      return [];
    }

    // Con output_config el bloque de texto ya es el JSON del esquema. Se sigue buscando el
    // bloque por tipo y no por posicion porque Opus 5 piensa por defecto y puede emitir
    // bloques `thinking` antes del texto.
    const bloque = response.content.find((b) => b.type === 'text');
    if (!bloque) return [];
    const datos = JSON.parse(bloque.text);
    return Array.isArray(datos.cambios) ? datos.cambios : [];
  } catch (err) {
    console.error('[AI Sync] Error llamando a Claude:', err);
    throw errorDeIA(err);
  }
}

module.exports = { analyzeCatalog, SinClave, ClaveInvalida, LimiteIA, errorDeIA, ESQUEMA_CAMBIOS };

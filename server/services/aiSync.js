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

// La clave es válida pero la cuenta no tiene saldo: la API devuelve un 400 con «credit balance
// is too low». Es un caso de facturación, distinto de una petición mal formada (también 400),
// y se separa para no mandar a revisar el catálogo cuando lo que falta es cargar créditos.
class SinSaldo extends Error {
  constructor() {
    super('La cuenta de la API de IA no tiene saldo suficiente (crédito insuficiente). '
      + 'Añade créditos o revisa la facturación en la consola de Anthropic (Plans & Billing).');
    this.code = 'SIN_SALDO';
  }
}

// El modelo declinó la petición (stop_reason «refusal»). Sus clasificadores de seguridad pueden
// rechazar trabajo legítimo, y este catálogo es de cortafuegos, IPS y VPN. Un rechazo no es
// «el catálogo está al día»: es que no hubo análisis, así que no puede acabar en una lista vacía.
class RechazoIA extends Error {
  constructor(categoria) {
    super(`La IA declinó analizar esta petición${categoria ? ` (categoría «${categoria}»)` : ''}. `
      + 'No se comparó nada: este resultado no dice si el catálogo está al día.');
    this.code = 'RECHAZO_IA';
  }
}

// La respuesta se cortó en max_tokens. Si el corte cae dentro del pensamiento no hay ni una
// línea de texto, y leer eso como lista vacía diría «el catálogo está al día».
class RespuestaCortada extends Error {
  constructor() {
    super('La respuesta de la IA se cortó antes de terminar (límite de tokens), así que no se '
      + 'revisó el catálogo entero. Prueba con un documento más corto o por partes.');
    this.code = 'RESPUESTA_CORTADA';
  }
}

// Reúne el texto útil del error del SDK para poder distinguir un 400 de facturación de uno de
// petición inválida. El cuerpo puede venir en `.error`, `.body` o solo en `.message`.
function textoError(err) {
  if (!err) return '';
  const partes = [err.message];
  try { partes.push(JSON.stringify(err.error || err.body || {})); } catch { /* cuerpo no serializable */ }
  return partes.filter(Boolean).join(' ');
}

// Traduce el error crudo del SDK al error propio que la ruta sabe convertir en un HTTP claro.
// Se decide por el código de estado (y, para el 400, por el texto) y no por `instanceof`, que
// es frágil a través de la frontera del módulo (la clase concreta del SDK puede variar entre
// versiones/envoltorios).
function errorDeIA(err) {
  const status = err && err.status;
  if (status === 401 || status === 403) return new ClaveInvalida();
  if (status === 429) return new LimiteIA();
  // No todo 400 es de saldo: solo el que lo dice. El resto son peticiones inválidas de verdad.
  if (status === 400 && /credit balance|too low|billing|insufficient/i.test(textoError(err))) {
    return new SinSaldo();
  }
  return new Error('No se pudo analizar el catálogo con IA.');
}

const MODELO = 'claude-opus-5';
// Opus 5 piensa por defecto, y max_tokens topa pensamiento MÁS respuesta: con un Product
// Matrix entero, el pensamiento puede comerse el tope antes de escribir la lista. Solo se
// cobra lo que se genera, así que un tope holgado no encarece la llamada normal.
const MAX_TOKENS = 64000;

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
1. Equipos: modelos cuyas métricas técnicas (fw, ips, vpn, ipsec, etc.) estén desactualizadas frente a la documentación oficial del fabricante, y modelos importantes que falten.
2. Precios desactualizados frente a la lista de precios oficial.
3. Bundles de licencia, niveles de soporte y SKUs de partes desactualizados o ausentes.

REGLAS
- Sin duplicados: si el valor que ibas a proponer coincide con el del catálogo, no lo devuelvas. Compara el valor, no el formato del texto («300» y «300 Mbps» son el mismo dato).
- Solo con fuente: propón un dato solo si tienes una fuente que lo respalde. Un SKU o un precio verosímil pero inventado es el peor resultado posible, porque quien arma una propuesta cita estas cifras delante de un cliente; este catálogo ya tuvo una vez un modelo inexistente con precio y specs creíbles.
- Usa la misma unidad y formato que ya usa el campo (no mezcles Gbps con Mbps).
- Si no hay ningún cambio real, devuelve la lista vacía.

CÓMO SE ESTRUCTURA newValue
- UPDATE de un campo simple de equipo: el valor escalar nuevo, como texto.
- UPDATE de precio (field='price'): objeto JSON serializado {"priceDisplay":"~ $1,800","priceNumeric":1800}.
- NEW de equipo: objeto JSON serializado con las specs base y, si las hay, priceDisplay/priceNumeric.
- NEW de licencia: {"name":...,"description":...}. NEW de soporte: {"name":...,"sla":...,"description":...}. NEW de parte: {"sku":...,"description":...}.
- UPDATE de licencia, soporte o parte: el valor escalar nuevo.`;

// La respuesta del modelo convertida en la lista de cambios. Una lista vacía significa «el
// catálogo está al día», así que solo sale de una respuesta completa que lo diga: lo demás es
// un error con su causa. Va aparte de la llamada para poder probarla sin red.
function cambiosDeRespuesta(response) {
  if (response.stop_reason === 'refusal') {
    const motivo = response.stop_details && response.stop_details.category;
    console.warn(`[AI Sync] Claude declinó la solicitud${motivo ? ` (${motivo})` : ''}`);
    throw new RechazoIA(motivo);
  }
  if (response.stop_reason === 'max_tokens') throw new RespuestaCortada();
  // Con output_config el texto es el JSON del esquema. Se unen los bloques `text` en orden:
  // sin respaldo hay uno solo (detrás de los `thinking`, que Opus 5 emite por defecto), y si
  // el modelo declina a mitad y responde el de respaldo, el contenido trae el tramo del
  // primero, un bloque `fallback` y la continuación del segundo.
  const texto = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  if (!texto) throw new Error('La IA respondió sin texto: no hay lista de cambios que leer.');
  const iteraciones = (response.usage && response.usage.iterations) || [];
  if (iteraciones.some((i) => i.type === 'fallback_message')) {
    console.warn(`[AI Sync] Claude declinó y respondió el modelo de respaldo ${response.model}`);
  }
  const datos = JSON.parse(texto);
  return Array.isArray(datos.cambios) ? datos.cambios : [];
}

function textoDelAdjunto(file) {
  // `file.tipo` lo decide la ruta leyendo la firma del contenido (%PDF, PK..), no el
  // mimetype que declara el navegador: ese lo controla quien sube el archivo.
  if (file.tipo === 'xlsx' || file.tipo === 'csv') {
    const libro = xlsx.read(file.buffer, { type: 'buffer' });
    return xlsx.utils.sheet_to_csv(libro.Sheets[libro.SheetNames[0]]);
  }
  return null;
}

// El adjunto como bloque `document`. Un PDF va en base64; un texto plano no: la API solo
// acepta base64 con media_type application/pdf, y el texto va como fuente `text` con su
// contenido tal cual (BetaBase64PDFSource y BetaPlainTextSource en los tipos del SDK).
function bloqueAdjunto(file) {
  if (file.tipo === 'txt') {
    return { type: 'document', source: { type: 'text', media_type: 'text/plain', data: file.buffer.toString('utf8') } };
  }
  return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.buffer.toString('base64') } };
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
      contenido.push(bloqueAdjunto(file));
    }
    contenido.push({
      type: 'text',
      text: 'Hay un documento adjunto. Tiene prioridad absoluta sobre tu conocimiento previo: si lo contradice, manda el documento. Extrae de él las especificaciones exactas.',
    });
  } else {
    // Sin adjunto la única fuente es lo que el modelo sepa, y el panel permite analizar así.
    // Se le dice, porque el sistema habla de documentación oficial y aquí no hay ninguna.
    contenido.push({
      type: 'text',
      text: 'No hay documento adjunto. Tu única fuente es lo que sepas de la documentación oficial del fabricante, y puede ser anterior a cifras que este catálogo ya contrastó con documentos más recientes. Propón un cambio solo si sabes qué documento oficial lo respalda; pon su URL en sourceUrl solo si la conoces con certeza, y si no, déjalo vacío.',
    });
  }

  contenido.push({ type: 'text', text: `Revisa el catálogo de ${vendor} y devuelve solo los cambios reales.` });

  let response;
  try {
    // Streaming porque un Product Matrix completo con max_tokens alto puede pasarse del
    // tiempo limite de una peticion normal. `finalMessage()` espera al mensaje completo.
    // `fallbacks: 'default'`: si los clasificadores de seguridad declinan (este catálogo es de
    // cortafuegos, IPS y VPN), la API reintenta en el modelo que Anthropic recomienda para esa
    // categoría dentro de la misma llamada, y solo si ese también declina llega el rechazo.
    const stream = anthropic.beta.messages.stream({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: contenido }],
      output_config: {
        format: { type: 'json_schema', schema: ESQUEMA_CAMBIOS },
      },
    });
    response = await stream.finalMessage();
  } catch (err) {
    console.error('[AI Sync] Error llamando a Claude:', err);
    throw errorDeIA(err);
  }
  // Lo que costó el análisis, en el log del servicio: sin esta línea no se sabe si la caché
  // del catálogo se aprovecha ni cuánto pesa cada documento.
  const u = response.usage || {};
  console.log(`[AI Sync] ${vendor}: ${u.input_tokens || 0} tokens de entrada (+${u.cache_read_input_tokens || 0} leídos de caché, ${u.cache_creation_input_tokens || 0} escritos), ${u.output_tokens || 0} de salida`);
  // Fuera del try: un rechazo es un error propio y errorDeIA lo aplanaría en uno genérico.
  return cambiosDeRespuesta(response);
}

module.exports = {
  analyzeCatalog, cambiosDeRespuesta, bloqueAdjunto, SinClave, ClaveInvalida, LimiteIA, SinSaldo, RechazoIA,
  RespuestaCortada, errorDeIA, ESQUEMA_CAMBIOS,
};

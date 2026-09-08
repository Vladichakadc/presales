'use strict';
// Documentos de fuente oficiales subidos a mano, por fabricante — sin IA y sin crédito.
//
// POR QUE EN EL VOLUMEN Y NO EN LA BASE. La base de catálogo es efímera: se resiembra desde
// server/seed/legacyData/ en cada despliegue, así que un archivo subido allí se perdería en el
// siguiente deploy. Estos documentos y su registro viven en AUTH_STATE_DIR —el mismo volumen
// persistente donde ya viven los usuarios—, que es exactamente el sitio del estado que debe
// sobrevivir a un despliegue.
//
// QUE ACTUALIZA Y QUE NO. Subir aquí actualiza la PROCEDENCIA: qué documento oficial hay para
// ese fabricante, de qué fecha, con su hash, y guarda el archivo para poder consultarlo. NO
// reescribe las cifras del catálogo — estampar «verificado» sobre números que nadie contrastó
// es la mentira que este catálogo tiene prohibida. Convertir el documento en cambios del
// catálogo sigue siendo del importador (una persona, gratis) o de la IA (crédito).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATE_DIR = process.env.AUTH_STATE_DIR || path.join(__dirname, '..', '.auth');
const FUENTES_DIR = path.join(STATE_DIR, 'fuentes');
const MANIFIESTO = path.join(FUENTES_DIR, 'fuentes-subidas.json');

// Los códigos de fabricante válidos, los mismos del catálogo. Un vendor fuera de esta lista no
// puede crear carpeta ni entrada: cierra el path traversal por el parámetro de la ruta.
const VENDORS = new Set(['huawei', 'cisco', 'fortinet', 'mikrotik', 'aruba', 'juniper', 'nokia']);
const EXT = { pdf: 'pdf', xlsx: 'xlsx', csv: 'csv', txt: 'txt' };
const MAX_POR_FABRICANTE = 20;

function esVendor(v) { return typeof v === 'string' && VENDORS.has(v.toLowerCase()); }

function leerManifiesto() {
  try { return JSON.parse(fs.readFileSync(MANIFIESTO, 'utf8')); } catch { return {}; }
}
function escribirManifiesto(m) {
  fs.mkdirSync(FUENTES_DIR, { recursive: true });
  fs.writeFileSync(MANIFIESTO, JSON.stringify(m, null, 2), { mode: 0o600 });
}

function listar(vendor) {
  if (!esVendor(vendor)) return [];
  return leerManifiesto()[vendor.toLowerCase()] || [];
}

// Guarda un documento y registra su procedencia. Devuelve la entrada creada.
function registrar(vendor, { originalname, buffer, tipo, usuario } = {}) {
  const v = String(vendor).toLowerCase();
  if (!esVendor(v)) throw new Error('Fabricante no válido');
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Archivo vacío');
  const ext = EXT[tipo];
  if (!ext) throw new Error('Tipo de archivo no admitido');

  const id = crypto.randomBytes(8).toString('hex'); // 16 hex
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  // El nombre en disco lo generamos NOSOTROS: nunca el originalname, que lo controla quien
  // sube el archivo y es la vía clásica de path traversal.
  const archivo = `${v}-${id}.${ext}`;
  fs.mkdirSync(FUENTES_DIR, { recursive: true });
  fs.writeFileSync(path.join(FUENTES_DIR, archivo), buffer, { mode: 0o600 });

  const entrada = {
    id,
    // El nombre original solo se guarda para mostrarlo, saneado a caracteres inocuos.
    documento: String(originalname || 'documento').replace(/[^\w .()\-]+/g, '_').slice(0, 120),
    archivo,
    tipo,
    bytes: buffer.length,
    hash,
    fecha: new Date().toISOString(),
    usuario: usuario || null,
  };
  const m = leerManifiesto();
  // UNA VIGENTE POR FABRICANTE (decisión del dueño del repo, 2026-09-08). Antes esto acumulaba,
  // así que subir la lista de precios del trimestre nuevo dejaba dos filas «Cargada» iguales sin
  // decir cuál manda — que es exactamente lo que se detectó con la price list de Fortinet.
  //
  // Las anteriores NO se borran: pasan a histórico y su archivo sigue disponible. Reemplazar no
  // es destruir, y la versión anterior de una lista de precios es justo lo que hace falta para
  // explicar por qué una cotización de hace un mes decía otra cifra. Para borrarlas de verdad
  // está el botón Borrar, que es una acción deliberada y con confirmación.
  const previas = (m[v] || []).map((e) => ({ ...e, vigente: false }));
  m[v] = [{ ...entrada, vigente: true }, ...previas].slice(0, MAX_POR_FABRICANTE);
  escribirManifiesto(m);
  return entrada;
}

// Ruta en disco de un documento subido, con su entrada — o null si no existe o los parámetros
// no son válidos. El id se valida contra su forma exacta antes de tocar el disco.
function rutaArchivo(vendor, id) {
  if (!esVendor(vendor) || !/^[0-9a-f]{16}$/.test(String(id))) return null;
  const entrada = listar(vendor).find((e) => e.id === id);
  if (!entrada) return null;
  const ruta = path.join(FUENTES_DIR, entrada.archivo);
  return fs.existsSync(ruta) ? { ruta, entrada } : null;
}

// Borra un documento subido: el archivo del disco y su entrada del manifiesto. Devuelve la
// entrada borrada, o null si no existe (que es lo que la ruta convierte en 404).
//
// SOLO BORRA LO SUBIDO. Las fuentes de legacyData/fuentes.js no pasan por aquí y no son
// borrables desde la interfaz a propósito: viven en el código y se quitan con un commit, que
// deja diff y revisión. Un botón que borrara la procedencia del catálogo sin dejar rastro es
// justo lo contrario de lo que esta pantalla existe para dar.
//
// EL ARCHIVO PUEDE NO ESTAR Y LA ENTRADA SE RETIRA IGUAL. Si alguien borró el fichero del
// volumen a mano, dejar su fila en el manifiesto haría que la pestaña siguiera anunciando una
// fuente que ya no se puede abrir — un enlace roto presentado como procedencia.
function eliminar(vendor, id) {
  if (!esVendor(vendor) || !/^[0-9a-f]{16}$/.test(String(id))) return null;
  const v = String(vendor).toLowerCase();
  const m = leerManifiesto();
  const lista = m[v] || [];
  const entrada = lista.find((e) => e.id === id);
  if (!entrada) return null;

  // El nombre en disco lo generó `registrar`, pero se vuelve a acotar al directorio de fuentes
  // antes de borrar: un manifiesto manipulado a mano no debe poder apuntar fuera de él.
  const ruta = path.join(FUENTES_DIR, path.basename(String(entrada.archivo)));
  try { fs.unlinkSync(ruta); } catch { /* ya no estaba: la entrada se retira igual */ }

  const quedan = lista.filter((e) => e.id !== id);
  // Si se borró la vigente, la más reciente de las que quedan pasa a serlo: un fabricante con
  // documentos cargados pero ninguno vigente sería un estado que la pestaña no sabría explicar.
  if (quedan.length && !quedan.some((e) => e.vigente)) quedan[0] = { ...quedan[0], vigente: true };
  m[v] = quedan;
  escribirManifiesto(m);
  return entrada;
}

// Cuál es la vigente. Un manifiesto escrito antes de que existiera la marca no tiene `vigente`
// en ninguna entrada; ahí manda la más reciente, que es la primera de la lista.
function idVigente(lista) {
  const marcada = lista.find((e) => e.vigente);
  return marcada ? marcada.id : (lista[0] ? lista[0].id : null);
}

// La procedencia subida, en la MISMA forma que fuentesDe() de legacyData, para que el portal
// la pinte igual — pero con estado propio `cargada` y sin fingir antigüedad: `meses` va en
// null y la nota deja claro que actualiza la procedencia, no las cifras.
function comoProcedencia(vendor) {
  const lista = listar(vendor);
  const vigenteId = idVigente(lista);
  return lista.map((e) => ({
    documento: e.documento,
    // `vigente` es la que manda para ese fabricante; las demás son versiones anteriores que se
    // conservan para poder consultarlas (la lista de precios del trimestre pasado explica por
    // qué una cotización de entonces decía otra cifra). La interfaz las pliega.
    vigente: e.id === vigenteId,
    // El id viaja explícito (además de dentro de la url) porque es lo que la interfaz necesita
    // para poder borrar esta fuente sin tener que despiezar una ruta con una expresión regular.
    id: e.id,
    url: `/api/fuentes/${String(vendor).toLowerCase()}/documento/${e.id}`,
    fecha: e.fecha.slice(0, 10),
    meses: null,
    estado: e.id === vigenteId ? 'cargada' : 'historico',
    cubre: `Documento oficial cargado (${Math.round(e.bytes / 1024)} KB · ${e.tipo.toUpperCase()})`
      + (e.id === vigenteId ? '' : ' — versión anterior, sustituida por la vigente'),
    nota: 'Subido a mano como fuente oficial: actualiza la procedencia y queda disponible para '
      + 'consultar. No reescribe por sí mismo las cifras del catálogo — eso lo hace el importador '
      + '(con contraste) o la sincronización con IA.',
    hash: e.hash,
    subida: true,
  }));
}

module.exports = {
  listar, registrar, eliminar, rutaArchivo, comoProcedencia, esVendor, VENDORS,
};

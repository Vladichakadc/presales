'use strict';
// EL CATALOGO EN MEMORIA (ADR-3 de la auditoria del 2026-11-09, corte 1).
//
// POR QUE. En produccion la base SQLite se resiembra desde legacyData/ en cada arranque y no se
// escribe nunca: es una cache que se tira. ADR-3 propone proyectar legacyData/ en memoria «con las
// mismas funciones de catalogProjection.js». La forma con menos riesgo de que el resultado sea el
// mismo es no reescribir ni la siembra ni las 29 consultas: este modulo da los diez modelos del
// catalogo con el subconjunto de Sequelize que usan `seedCatalog.js` y `catalogProjection.js`, y las
// dos se ejecutan tal cual contra el. `test/catalogo-en-memoria.test.js` compara cada proyeccion
// con la de SQLite, campo a campo.
//
// LO QUE IMITA DE SQLITE, a proposito:
//   - cada consulta devuelve objetos nuevos: los campos JSON se guardan como texto y se leen otra
//     vez en cada consulta, asi que una proyeccion que modifique `specs` no contamina la siguiente;
//   - `id` autoincremental por tabla, en el orden de creacion, como la clave primaria de SQLite;
//   - sin `order`, el orden de creacion; con `order`, el de SQLite: NULL primero, luego numeros y
//     luego texto comparado byte a byte (la intercalacion BINARY por defecto);
//   - los indices unicos de cada modelo: crear un duplicado falla, como en la base.
// LO QUE NO IMITA: el orden que SQLite da sin ORDER BY cuando su plan usa un indice. Donde una
// proyeccion dependa de el, el orden se escribe en la consulta (la prueba lo encuentra).
//
// SUBCONJUNTO: findAll / findOne ({ where, order, include }), findOrCreate ({ where, defaults }),
// create, count, update (de la fila y del modelo, con where) y destroy (con where). `where` solo por
// igualdad, con un arreglo como IN y null como IS NULL. Cualquier otra cosa lanza: un uso nuevo se
// anade aqui, con su caso en la prueba, en vez de dar un resultado a medias.

const DEFINICIONES = {
  Vendor: { campos: ['code', 'name', 'colorHex', 'lastSyncedAt', 'lastSyncStatus'], unicos: [['code']] },
  Product: {
    campos: ['vendorId', 'category', 'model', 'series', 'specs', 'specSummary', 'priceDisplay',
      'priceNumeric', 'eol', 'sourceUrl', 'lastVerifiedAt'],
    json: ['specs'], defecto: { specs: {}, eol: false }, unicos: [['vendorId', 'model']],
  },
  OpticCategory: { campos: ['vendorId', 'code', 'label'], unicos: [['vendorId', 'code']] },
  Optic: {
    campos: ['opticCategoryId', 'sku', 'bomCodes', 'description', 'priceNumeric', 'reach'],
    json: ['bomCodes', 'reach'], defecto: { bomCodes: [] },
  },
  Part: { campos: ['vendorId', 'code', 'sku', 'description'], unicos: [['vendorId', 'code']] },
  // Las tablas intermedias de belongsToMany no tienen `id` en SQLite: su clave es el par.
  ProductOptic: { campos: ['productId', 'opticCategoryId'], sinId: true, unicos: [['productId', 'opticCategoryId']] },
  ProductPart: { campos: ['productId', 'partId'], sinId: true, unicos: [['productId', 'partId']] },
  SupportTier: { campos: ['vendorId', 'code', 'name', 'sla', 'description'], unicos: [['vendorId', 'code']] },
  LicenseBundle: { campos: ['vendorId', 'code', 'name', 'description'], unicos: [['vendorId', 'code']] },
  RoleRecommendation: { campos: ['role', 'productId', 'altText', 'note'] },
};
const FECHAS = ['lastSyncedAt', 'lastVerifiedAt', 'createdAt', 'updatedAt'];

// Las asociaciones de server/models/index.js que alguien incluye hoy, con el nombre de la
// propiedad que Sequelize pone en la fila.
const ASOCIACIONES = {
  'Product>Vendor': { tipo: 'pertenece', clave: 'vendorId', como: 'Vendor' },
  'RoleRecommendation>Product': { tipo: 'pertenece', clave: 'productId', como: 'Product' },
  'OpticCategory>Optic': { tipo: 'tieneMuchos', clave: 'opticCategoryId', como: 'Optics' },
  'Product>OpticCategory': { tipo: 'muchos', traves: 'ProductOptic', propia: 'productId', ajena: 'opticCategoryId', como: 'OpticCategories' },
  'Product>Part': { tipo: 'muchos', traves: 'ProductPart', propia: 'productId', ajena: 'partId', como: 'Parts' },
};

// Orden de SQLite con la intercalacion BINARY: NULL < numero < texto, y el texto byte a byte.
function rango(v) { return v == null ? 0 : typeof v === 'number' || typeof v === 'boolean' ? 1 : 2; }
function comparar(a, b) {
  const ra = rango(a); const rb = rango(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return 0;
  if (ra === 1) return Number(a) - Number(b);
  return Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
}

const PROTO_FILA = {
  async update(valores) {
    this._modelo._escribir(this.id, valores);
    const guardada = this._modelo._tabla().filas.find((f) => f.id === this.id);
    if (guardada) {
      const leida = this._modelo._leer(guardada);
      for (const k of [...Object.keys(valores), 'updatedAt']) this[k] = leida[k];
    }
    return this;
  },
  get(opciones) {
    if (typeof opciones === 'string') return this[opciones];
    return toPlain(this);
  },
  toJSON() { return toPlain(this); },
};

function crearCatalogo() {
  const tablas = {};
  const modelos = {};

  for (const [nombre, def] of Object.entries(DEFINICIONES)) {
    tablas[nombre] = { filas: [], siguiente: 1 };
    const json = new Set(def.json || []);
    const permitidos = new Set(['id', ...def.campos, 'createdAt', 'updatedAt']);

    const aGuardar = (campo, valor) => {
      if (json.has(campo)) return valor == null ? null : JSON.stringify(valor);
      if (FECHAS.includes(campo)) return valor == null ? null : new Date(valor).toISOString();
      return valor === undefined ? null : valor;
    };
    const aLeer = (campo, guardado) => {
      if (json.has(campo)) return guardado == null ? null : JSON.parse(guardado);
      if (FECHAS.includes(campo)) return guardado == null ? null : new Date(guardado);
      return guardado;
    };
    const comprobarCampos = (valores, donde) => {
      for (const k of Object.keys(valores)) {
        if (!permitidos.has(k)) throw new Error(`catalogoEnMemoria: ${nombre} no tiene el campo «${k}» (${donde})`);
      }
    };
    const casa = (fila, where) => {
      if (!where) return true;
      comprobarCampos(where, 'where');
      return Object.entries(where).every(([k, v]) => {
        if (Array.isArray(v)) return v.some((x) => comparar(fila[k], aGuardar(k, x)) === 0 && fila[k] != null);
        if (v === null) return fila[k] == null;
        if (typeof v === 'object') throw new Error(`catalogoEnMemoria: ${nombre}.${k} con un operador que no se imita`);
        return fila[k] != null && comparar(fila[k], aGuardar(k, v)) === 0;
      });
    };
    const unicoRoto = (fila) => (def.unicos || []).some((cols) => tablas[nombre].filas.some((o) =>
      o.id !== fila.id && cols.every((c) => o[c] != null && comparar(o[c], fila[c]) === 0)));

    const modelo = { name: nombre };

    // Una fila tal como la devuelve una consulta: campos leidos de nuevo y, si se pide, sus
    // asociaciones. `update` escribe en la tabla y en la propia fila.
    const leer = (guardada, include) => {
      const fila = Object.create(PROTO_FILA);
      Object.defineProperty(fila, '_modelo', { value: modelo });
      for (const k of [...(def.sinId ? [] : ['id']), ...def.campos, 'createdAt', 'updatedAt']) fila[k] = aLeer(k, guardada[k]);
      for (const inc of include || []) resolverInclude(nombre, guardada, fila, inc);
      return fila;
    };

    Object.assign(modelo, {
      _guardar: aGuardar,
      _leer: leer,
      _tabla: () => tablas[nombre],
      _escribir(id, valores) {
        comprobarCampos(valores, 'update');
        const guardada = tablas[nombre].filas.find((f) => f.id === id);
        if (!guardada) return;
        const nueva = { ...guardada };
        for (const [k, v] of Object.entries(valores)) nueva[k] = aGuardar(k, v);
        nueva.updatedAt = new Date().toISOString();
        if (unicoRoto(nueva)) throw new Error(`catalogoEnMemoria: ${nombre} duplicaria un indice unico`);
        Object.assign(guardada, nueva);
      },
      async findAll(opciones = {}) {
        const { where, order, include, ...resto } = opciones;
        if (Object.keys(resto).length) throw new Error(`catalogoEnMemoria: ${nombre}.findAll con opciones que no se imitan: ${Object.keys(resto).join(', ')}`);
        let filas = tablas[nombre].filas.filter((f) => casa(f, where));
        // `order` admite [campo, 'ASC'] de la propia tabla y [Modelo, campo, 'ASC'] de un modelo
        // incluido, que ordena la lista de esa asociacion en cada fila.
        const propio = [];
        const deIncluidos = [];
        for (const par of order || []) {
          const asc = Array.isArray(par) && String(par[par.length - 1]).toUpperCase() === 'ASC';
          if (asc && par.length === 2 && typeof par[0] === 'string') propio.push(par[0]);
          else if (asc && par.length === 3 && par[0] && par[0].name && typeof par[1] === 'string') deIncluidos.push([par[0].name, par[1]]);
          else throw new Error(`catalogoEnMemoria: ${nombre}.findAll con un orden que no se imita`);
        }
        const porCampos = (campos) => (a, b) => {
          for (const campo of campos) {
            const c = comparar(a[campo], b[campo]);
            if (c) return c;
          }
          return 0;
        };
        if (propio.length) filas = [...filas].sort(porCampos(propio));
        const leidas = filas.map((f) => leer(f, include));
        for (const [hijo, campo] of deIncluidos) {
          const asoc = ASOCIACIONES[`${nombre}>${hijo}`];
          if (!asoc || asoc.tipo === 'pertenece') throw new Error(`catalogoEnMemoria: ${nombre} no ordena por ${hijo}`);
          for (const f of leidas) if (Array.isArray(f[asoc.como])) f[asoc.como].sort(porCampos([campo]));
        }
        return leidas;
      },
      async findOne(opciones = {}) {
        return (await modelo.findAll(opciones))[0] || null;
      },
      async count(opciones = {}) {
        return tablas[nombre].filas.filter((f) => casa(f, opciones.where)).length;
      },
      async create(valores = {}) {
        comprobarCampos(valores, 'create');
        const guardada = { id: tablas[nombre].siguiente };
        const ahora = new Date().toISOString();
        for (const k of def.campos) {
          const v = valores[k] !== undefined ? valores[k] : (def.defecto || {})[k];
          guardada[k] = aGuardar(k, v);
        }
        guardada.createdAt = ahora;
        guardada.updatedAt = ahora;
        if (unicoRoto(guardada)) throw new Error(`catalogoEnMemoria: ${nombre} duplicaria un indice unico`);
        tablas[nombre].siguiente += 1;
        tablas[nombre].filas.push(guardada);
        return leer(guardada);
      },
      async findOrCreate({ where, defaults } = {}) {
        if (!where) throw new Error(`catalogoEnMemoria: ${nombre}.findOrCreate sin where`);
        const hallada = await modelo.findOne({ where });
        if (hallada) return [hallada, false];
        // Como Sequelize: los `defaults` y, de `where`, lo que falte en ellos.
        const valores = { ...(defaults || {}) };
        for (const [k, v] of Object.entries(where)) if (valores[k] === undefined) valores[k] = v;
        return [await modelo.create(valores), true];
      },
      async update(valores, { where } = {}) {
        const filas = tablas[nombre].filas.filter((f) => casa(f, where));
        for (const f of filas) modelo._escribir(f.id, valores);
        return [filas.length];
      },
      async destroy({ where } = {}) {
        const t = tablas[nombre];
        const antes = t.filas.length;
        t.filas = t.filas.filter((f) => !casa(f, where));
        return antes - t.filas.length;
      },
    });
    modelos[nombre] = modelo;
  }

  function resolverInclude(padre, guardada, fila, inc) {
    const hijo = inc && inc.model && inc.model.name;
    const asoc = ASOCIACIONES[`${padre}>${hijo}`];
    if (!asoc || !modelos[hijo] || inc.model !== modelos[hijo]) {
      throw new Error(`catalogoEnMemoria: ${padre} no incluye ${hijo || 'eso'} (asociacion no declarada)`);
    }
    const otros = tablas[hijo].filas;
    const anidado = inc.include;
    if (asoc.tipo === 'pertenece') {
      const o = otros.find((x) => x.id === guardada[asoc.clave]);
      fila[asoc.como] = o ? modelos[hijo]._leer(o, anidado) : null;
    } else if (asoc.tipo === 'tieneMuchos') {
      fila[asoc.como] = otros.filter((x) => x.id != null && x[asoc.clave] === guardada.id)
        .map((x) => modelos[hijo]._leer(x, anidado));
    } else {
      const traves = modelos[asoc.traves];
      fila[asoc.como] = tablas[asoc.traves].filas.filter((t) => t[asoc.propia] === guardada.id)
        .map((t) => {
          const o = otros.find((x) => x.id === t[asoc.ajena]);
          if (!o) return null;
          const leida = modelos[hijo]._leer(o, anidado);
          leida[asoc.traves] = traves._leer(t);
          return leida;
        })
        .filter(Boolean);
    }
  }

  return modelos;
}

function toPlain(fila) {
  const salida = {};
  for (const [k, v] of Object.entries(fila)) {
    if (Array.isArray(v)) salida[k] = v.map((x) => (x && typeof x === 'object' && x._modelo ? toPlain(x) : x));
    else if (v && typeof v === 'object' && v._modelo) salida[k] = toPlain(v);
    else salida[k] = v;
  }
  return salida;
}

// El catalogo sembrado con la misma seedCatalog() del arranque. Se siembra una vez por proceso:
// legacyData/ no cambia sin un despliegue.
let sembrado = null;
function catalogoEnMemoria() {
  if (!sembrado) {
    const modelos = crearCatalogo();
    const seedCatalog = require('../seed/seedCatalog');
    sembrado = seedCatalog(modelos).then(() => modelos);
  }
  return sembrado;
}

module.exports = { crearCatalogo, catalogoEnMemoria, comparar };

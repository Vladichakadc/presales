'use strict';
// Lint minimo y con motivo. No es un manual de estilo: cada regla activada aqui corresponde
// a un fallo que este repositorio YA tuvo y que llego a produccion, o a una que la CSP de
// este sitio convierte en obligatoria.
//
// - `no-undef` habria cazado el "BOM is not defined" del cotizador: la pagina llamaba a
//   BOM.recogerEntrada() sin cargar /js/bom.js y se quedaba sin BOM.
// - `no-use-before-define` habria cazado el TDZ de `capDe` en el dimensionador de Cisco,
//   usado en el filtro de candidatos varias lineas antes de su `const`.
// - `no-unused-vars` es la senal barata de que quedo codigo muerto tras una limpieza, que es
//   justo como sobrevivio inerte el conjunto CISCO_EOL_MODELS.
//
// Lo que NO se activa: nada de formato (comillas, comas finales, ancho de linea). Este
// codigo se lee bien y reformatearlo entero produciria un diff enorme sin arreglar nada.
//
// TRES ENTORNOS DISTINTOS, y por eso la configuracion esta partida: el servidor es CommonJS
// con globals de Node, public/js/ son IIFE de navegador SIN modulos (por eso sus APIs
// globales se declaran aqui: MikroTik, FICHA, BOM... no hay import que las traiga), y las
// pruebas mezclan Node con el ejecutor propio.

const globalsNode = {
  require: 'readonly', module: 'writable', exports: 'writable', process: 'readonly',
  __dirname: 'readonly', __filename: 'readonly', console: 'readonly', Buffer: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
  clearInterval: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', fetch: 'readonly',
  // AbortController lo usa el vigia de fuentes para no quedarse colgado esperando a un
  // servidor de fabricante que no responde.
  AbortController: 'readonly',
};

const globalsNavegador = {
  window: 'readonly', document: 'readonly', location: 'readonly', history: 'readonly',
  navigator: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly',
  console: 'readonly', fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
  setInterval: 'readonly', clearInterval: 'readonly', URL: 'readonly',
  URLSearchParams: 'readonly', CSS: 'readonly', MutationObserver: 'readonly',
  Event: 'readonly', CustomEvent: 'readonly', Blob: 'readonly', FormData: 'readonly',
  requestAnimationFrame: 'readonly', getComputedStyle: 'readonly', alert: 'readonly',
  confirm: 'readonly', XLSX: 'readonly',
  // APIs que las paginas se pasan entre si por `window`, ya que no hay sistema de modulos.
  FICHA: 'readonly', BOM: 'readonly', ESTADO: 'readonly', TABLA: 'readonly', COMPARADOR: 'readonly',
};

const reglas = {
  'no-undef': 'error',
  // ignoreRestSiblings reconoce el idioma `const { prGroup, ...rest } = specs`, que quita
  // una clave a proposito: ahi la variable "sin usar" ES el mecanismo, no un descuido.
  'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
  'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
  'no-redeclare': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-fallthrough': 'error',
  'no-cond-assign': 'error',
  'no-constant-condition': ['error', { checkLoops: false }],
  'no-self-compare': 'error',
  'no-template-curly-in-string': 'warn',
  'valid-typeof': 'error',
  'use-isnan': 'error',
  eqeqeq: ['warn', 'smart'],
  // La CSP de este sitio es script-src 'self': un eval o un `new Function` no correria, y
  // fallaria en produccion sin avisar en desarrollo.
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
};

module.exports = [
  { ignores: ['node_modules/**', 'public/vendor/**', 'database.sqlite'] },
  {
    files: ['server/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: globalsNode },
    rules: reglas,
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globalsNavegador },
    rules: reglas,
  },
  {
    files: ['test/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: globalsNode },
    rules: { ...reglas, 'no-unused-vars': 'off' },
  },
];

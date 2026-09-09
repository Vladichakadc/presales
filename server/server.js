require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');

const auth = require('./auth');
const { sequelize, Vendor, Product } = require('./models');
const seedCatalog = require('./seed/seedCatalog');
const { fuentesQueAvisan } = require('./seed/legacyData/fuentes');

const catalogRoutes = require('./routes/catalog');
const cotizadorRoutes = require('./routes/cotizador');
const dimensionadorRoutes = require('./routes/dimensionador');
const guiaRoutes = require('./routes/guia');
const syncRoutes = require('./routes/sync');
const multer = require('multer');
const fuentesSubidas = require('./fuentesSubidas');
const { referenciasDe } = require('./services/referencias');
const { tipoPorFirma } = require('./services/firmaArchivo');

const app = express();
const PORT = process.env.PORT || 4000;

// Railway va detras de proxy: sin esto, la IP que ve el limitador de intentos es la del
// proxy y todos los clientes comparten cuota.
app.set('trust proxy', 1);

// Content-Security-Policy. Estuvo desactivada mientras las paginas llevaban su JavaScript
// en bloques <script> en linea y manejadores onclick=, que una politica seria bloquea.
// Ese codigo se movio a /js/*.js y los manejadores a delegacion de eventos, asi que ya se
// puede exigir script-src 'self': un <script> inyectado en el HTML deja de ejecutarse.
//
// style-src conserva 'unsafe-inline' a proposito. Las paginas llevan su hoja de estilos en
// un bloque <style> y usan unos 225 atributos style= en linea; extraerlos seria un refactor
// grande a cambio de poco, porque una inyeccion de CSS es mucho menos peligrosa que una de
// script. Si algun dia se extraen, basta con quitar ese 'unsafe-inline' de aqui.
//
// Los dominios de fabricantes que aparecen en las paginas son enlaces <a href>, no recursos
// que el navegador descargue, por eso no figuran: solo Google Fonts se carga de fuera.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:'],
      'connect-src': ["'self'"],   // todas las llamadas son a /api/* del mismo origen
      'form-action': ["'self'"],   // el formulario de acceso solo puede enviarse aqui
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
    },
  },
}));
app.use(express.json({ limit: '1mb' }));

// Se retiro `cors()`: no habia ningun consumidor de otro origen, la API es de mismo origen,
// y una politica abierta solo agrega superficie de ataque.

// /js/login.js entra aqui por necesidad: es el script de la propia pagina de acceso, asi que
// si quedara detras del muro nadie podria iniciar sesion — la peticion se redirigiria al
// login, el navegador recibiria HTML donde espera JavaScript, y el formulario quedaria
// inerte. No expone nada: solo envia el formulario y pinta el mensaje de error.
// /js/fuentes.js tambien: la pagina de acceso usa las mismas tipografias, y si queda detras
// del muro el navegador recibe HTML donde espera JavaScript y lo rechaza por MIME. No expone
// nada — solo devuelve a `all` una hoja de estilos marcada como `print`.
// /salud entra aqui porque el healthcheck de Railway no tiene sesion: si quedara detras del
// muro recibiria un 302 al login y Railway leeria "sano" en una redireccion, que es
// exactamente el falso positivo que un healthcheck no puede permitirse.
const PUBLICO = new Set(['/login', '/login.html', '/js/login.js', '/js/fuentes.js', '/favicon.ico', '/salud']);

// Muro de autenticacion. Todo lo que no este en PUBLICO exige sesion valida; las peticiones
// de API responden 401 en JSON y la navegacion se redirige al login conservando el destino.
app.use((req, res, next) => {
  if (PUBLICO.has(req.path)) return next();
  // El usuario se resuelve UNA vez y viaja en req.usuario: si cada ruta volviera a mirar la
  // cookie, tarde o temprano una se olvidaria de hacerlo.
  const usuario = auth.usuarioDeSesion(req);
  if (usuario) { req.usuario = usuario; return next(); }
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Sesión requerida' });
  const destino = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?m=sesion&r=${destino}`);
});

// Muro del primer acceso. Un usuario dado de alta por un administrador nace con
// debeCambiar:true y una contrasena temporal que el propio administrador acaba de leer en
// pantalla: eso no es un aviso que se pueda descartar (como desdeSemilla, para la cuenta
// migrada), es una condicion que hay que cumplir antes de tocar nada mas. Solo se deja pasar
// lo imprescindible para cambiar la propia contrasena y cerrar sesion; todo lo demas redirige
// a /cuenta (navegacion) o responde 403 explicando por que (API).
const PERMITIDO_CON_CAMBIO_PENDIENTE = new Set(['/cuenta', '/js/cuenta.js', '/api/cuenta/estado', '/api/cuenta/password', '/logout']);
app.use((req, res, next) => {
  if (!req.usuario || !req.usuario.debeCambiar || PERMITIDO_CON_CAMBIO_PENDIENTE.has(req.path)) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Debes cambiar la contraseña temporal antes de continuar.', debeCambiar: true });
  }
  return res.redirect('/cuenta?m=forzado');
});

// Autorizacion por permiso, declarada en usuarios.js. Va aqui y no dentro de cada ruta para
// que anadir una pantalla protegida sea anadir una linea, no recordar un patron.
const exige = (permiso) => (req, res, next) => {
  if (auth.permiso(req.usuario, permiso)) return next();
  // baseUrl + path, no solo path: montado con app.use('/api/sync', ...) Express recorta el
  // prefijo y req.path vale '/analyze'. Solo con req.path la API se redirigia al portal y
  // el navegador veia un 200 — lo encontro la prueba de servidor al exigir el 403.
  const ruta = (req.baseUrl || '') + req.path;
  if (ruta.startsWith('/api/')) return res.status(403).json({ error: 'No tienes permiso para esta operación.' });
  return res.redirect('/?m=sinpermiso');
};

// Estado del servicio, para el healthcheck de Railway. Un build verde no es una aplicacion
// corriendo: lo que prueba que este contenedor sirve es que la base este sembrada, asi que
// se cuenta el catalogo en vez de devolver un {ok:true} que estaria igual de verde con la
// base vacia. Sin sesion a proposito (ver PUBLICO), y sin datos sensibles: cuantos, no
// cuales ni a que precio.
app.get('/salud', async (req, res) => {
  try {
    const [fabricantes, modelos] = await Promise.all([Vendor.count(), Product.count()]);
    if (!fabricantes || !modelos) {
      return res.status(503).json({ ok: false, error: 'catálogo vacío', fabricantes, modelos });
    }
    res.json({ ok: true, fabricantes, modelos });
  } catch {
    // La base no responde: 503 y no 500, que es lo que hace que Railway retire este
    // contenedor del balanceo en vez de mandarle trafico.
    res.status(503).json({ ok: false, error: 'base de datos no disponible' });
  }
});

app.get('/login', (req, res) => {
  if (auth.haySesion(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  // El retardo va antes de cualquier comprobacion: es lo que frena al atacante que rota
  // X-Forwarded-For y por tanto se salta el contador por IP.
  await auth.esperarRetardo();
  if (auth.intentosRestantes(req) <= 0) {
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera 15 minutos antes de volver a probar.' });
  }
  const { usuario, password } = req.body || {};
  if (typeof usuario !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Faltan credenciales.' });
  }
  const autenticado = auth.comprobarCredenciales(usuario, password);
  if (!autenticado) {
    auth.registrarFallo(req);
    const quedan = auth.intentosRestantes(req);
    // Un solo mensaje para usuario y contrasena erroneos: distinguirlos permitiria
    // enumerar cual de los dos es valido.
    return res.status(401).json({
      error: `Usuario o contraseña incorrectos.${quedan <= 3 ? ` Te quedan ${quedan} intento(s).` : ''}`,
    });
  }
  auth.limpiarIntentos(req);
  auth.ponerCookieSesion(res, autenticado);
  console.log(`[auth] acceso concedido · usuario=${autenticado.usuario} · rol=${autenticado.rol}`);
  res.json({ ok: true });
});

app.post('/logout', (req, res) => {
  auth.borrarCookieSesion(res);
  res.json({ ok: true });
});

app.get('/cuenta', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cuenta.html')));

app.get('/api/cuenta/estado', (req, res) => res.json({
  usuario: req.usuario.usuario,
  nombre: req.usuario.nombre,
  rol: req.usuario.rol,
  rolNombre: (auth.ROLES[req.usuario.rol] || {}).n || req.usuario.rol,
  puedeUsuarios: auth.permiso(req.usuario, 'usuarios'),
  puedeSync: auth.permiso(req.usuario, 'sync'),
  usandoSemilla: !!req.usuario.desdeSemilla,
  debeCambiar: !!req.usuario.debeCambiar,
}));

app.post('/api/cuenta/password', (req, res) => {
  const { actual, nueva } = req.body || {};
  // Solo la propia: no hay ruta para que un usuario cambie la contrasena de otro, ni
  // siquiera un administrador. Restablecer a otra persona se hace borrando el archivo de
  // estado, que es una accion con acceso al servidor y deja rastro.
  const r = auth.cambiarPassword(req.usuario.id, actual, nueva);
  if (!r.ok) return res.status(400).json({ error: r.error });
  auth.borrarCookieSesion(res); // cambiar la clave cierra la sesion: obliga a reautenticarse
  res.json({ ok: true });
});

/* ── Usuarios (solo administrador) ───────────────────────────────────────────── */

app.get('/usuarios', exige('usuarios'), (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'usuarios.html')));

app.get('/api/usuarios', exige('usuarios'), (req, res) => res.json({
  usuarios: auth.listarUsuarios(),   // sin hashes: usuarios.js nunca los deja salir
  roles: auth.ROLES,
  yo: req.usuario.id,
}));

// Alta de usuarios. La contrasena la genera el servidor y se devuelve UNA sola vez en esta
// respuesta — nunca se guarda en claro ni se registra en el log — para que el administrador
// la comunique por un canal distinto a este panel. La cuenta nace con debeCambiar:true, y el
// muro de arriba le impide usar cualquier otra pantalla hasta que la cambie de verdad.
app.post('/api/usuarios', exige('usuarios'), (req, res) => {
  const { usuario, nombre, rol } = req.body || {};
  const r = auth.crearUsuario({ usuario, nombre, rol });
  if (!r.ok) return res.status(400).json({ error: r.error });
  console.log(`[usuarios] alta · usuario=${r.usuario.usuario} · rol=${r.usuario.rol} · por=${req.usuario.usuario}`);
  res.status(201).json({ ok: true, usuario: r.usuario, passwordTemporal: r.passwordTemporal });
});

// SheetJS para el navegador, servido desde la dependencia que ya usa el sync para leer
// Excel. Las paginas lo cargan solo al pulsar "Exportar a Excel", asi que no pesa en la
// carga inicial. Evita duplicar ~900 KB en public/ y que se desincronice de package.json.
app.get('/vendor/xlsx.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(require.resolve('xlsx/dist/xlsx.full.min.js'));
});

// headroom.js: oculta/muestra un encabezado fijo segun el sentido del scroll. Mismo patron
// que xlsx.js — se sirve desde la dependencia instalada en vez de duplicar el archivo en
// public/, asi que la version vive en un solo sitio (package.json).
app.get('/vendor/headroom.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(require.resolve('headroom.js/dist/headroom.js'));
});

// ── Fuentes oficiales subidas a mano, por fabricante ──────────────────────────
// Sube el documento oficial (datasheet, lista de precios) de un fabricante y la pestaña
// «Fuentes y Referencias» de ese fabricante lo refleja al instante: sin IA y sin crédito.
// Actualiza la PROCEDENCIA (qué documento hay, de qué fecha, su hash) y guarda el archivo
// para consultarlo — no reescribe las cifras del catálogo (ver server/fuentesSubidas.js).
// Los documentos viven en el volumen persistente, no en la base efímera, así que sobreviven
// a un despliegue. El registro va con el permiso `sync`, como el resto de mantenimiento del
// catálogo; consultarlos, con sesión válida basta.
const subirFuente = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/fuentes/:vendor', exige('sync'), subirFuente.single('documento'), (req, res) => {
  const { vendor } = req.params;
  if (!fuentesSubidas.esVendor(vendor)) return res.status(400).json({ error: 'Fabricante no válido' });
  if (!req.file) return res.status(400).json({ error: 'Falta el documento' });

  // El tipo lo decide la firma del contenido, no la extensión del navegador — mismo criterio
  // que el sync con IA. Lo que no sea PDF, XLSX, CSV o TXT no se guarda.
  const tipo = tipoPorFirma(req.file.buffer, req.file.originalname);
  if (!tipo) {
    return res.status(415).json({ error: 'El archivo no es un PDF, XLSX ni un texto CSV/TXT reconocible. Se comprueba el contenido, no la extensión.' });
  }
  try {
    const entrada = fuentesSubidas.registrar(vendor, {
      originalname: req.file.originalname, buffer: req.file.buffer, tipo, usuario: req.usuario.usuario,
    });
    console.log(`[fuentes] carga · fabricante=${vendor} · ${entrada.documento} · ${entrada.bytes}B · por=${req.usuario.usuario}`);
    res.status(201).json({ ok: true, entrada });
  } catch (err) {
    console.error('[fuentes] error al registrar:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/fuentes/:vendor/documento/:id', (req, res) => {
  const encontrado = fuentesSubidas.rutaArchivo(req.params.vendor, req.params.id);
  if (!encontrado) return res.status(404).json({ error: 'Documento no encontrado' });
  res.sendFile(encontrado.ruta);
});

// Borrar una fuente CARGADA. Exige `sync` igual que subirla: quitar la procedencia de un
// fabricante es mantenimiento del catálogo, no consulta. Ocultar el botón a quien no lo tenga
// es comodidad; esto es el control. Solo alcanza a los documentos subidos — los de
// legacyData/fuentes.js no pasan por aquí y se quitan con un commit, que deja diff.
app.delete('/api/fuentes/:vendor/documento/:id', exige('sync'), (req, res) => {
  const { vendor, id } = req.params;
  if (!fuentesSubidas.esVendor(vendor)) return res.status(400).json({ error: 'Fabricante no válido' });
  const entrada = fuentesSubidas.eliminar(vendor, id);
  if (!entrada) return res.status(404).json({ error: 'Documento no encontrado' });
  console.log(`[fuentes] borrado · fabricante=${vendor} · ${entrada.documento} · por=${req.usuario.usuario}`);
  res.json({ ok: true, entrada });
});

// ── Referencias de pedido de un equipo ────────────────────────────────────────
// Que hay que PEDIR, no solo que equipo elegir. Va bajo demanda y por modelo a proposito: las
// 6.849 referencias de Fortinet pesan 774 KB, y meterlas en el payload del dimensionador
// cargaria eso en cada visita a la pagina para mostrar como mucho las de un equipo. Por modelo
// son unos 12 KB. Detras del muro de sesion, como el resto del catalogo.
app.get('/api/referencias/:vendor/:modelo', (req, res) => {
  const r = referenciasDe(req.params.vendor, req.params.modelo);
  if (!r) return res.status(400).json({ error: 'Fabricante no válido' });
  res.json(r);
});

app.use('/api', catalogRoutes);
app.use('/api', cotizadorRoutes);
app.use('/api', dimensionadorRoutes);
app.use('/api', guiaRoutes);
// El permiso `sync` existia en ROLES desde que hubo roles, pero ninguna ruta lo exigia: un
// permiso que no se comprueba es un permiso que no existe, igual que el conjunto inerte de
// fuera de venta que ya se retiro. Va aqui, delante del router, para que ninguna ruta nueva
// de /api/sync/* pueda olvidarlo.
app.use('/api/sync', exige('sync'));
app.use('/api', syncRoutes);

// El dimensionador de Huawei se llamaba dimensionador-bom-huawei-v3_1.html: un resto del
// versionado informal anterior a git. Renombrarlo sin mas romperia los enlaces que ya estan
// pegados en chats y guardados en marcadores —y esta herramienta existe justo para pasarse
// escenarios por enlace, asi que romperlos no es un detalle. Se redirige conservando el
// querystring, que es donde viaja el escenario: sin eso, el enlace llegaria a la pagina
// correcta con los parametros por defecto, que es peor que un 404 porque no se nota.
const RENOMBRADAS = new Map([
  ['/dimensionador-bom-huawei-v3_1.html', '/dimensionador-huawei-netengine.html'],
  ['/js/dimensionador-bom-huawei-v3_1.js', '/js/dimensionador-huawei-netengine.js'],
]);
app.get([...RENOMBRADAS.keys()], (req, res) => {
  const destino = RENOMBRADAS.get(req.path);
  const qs = req.originalUrl.slice(req.path.length);
  res.redirect(301, destino + qs);
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Aviso de fuentes viejas o sin fechar. Va en el arranque y no en la siembra porque la
// siembra solo corre con la base vacia, y la pregunta "de cuando son estas cifras" hay que
// hacersela en cada despliegue. Es un aviso, nunca un fallo: un catalogo con una fuente de
// hace ocho meses sigue sirviendo, solo conviene saberlo antes de citarlo en una propuesta.
function avisarDeFuentes() {
  const avisos = fuentesQueAvisan();
  if (!avisos.length) return;
  for (const a of avisos) {
    const cuando = a.estado === 'sin fecha'
      ? 'sin fecha en el catálogo'
      : `${a.meses} meses`;
    console.warn(`[fuentes] ${a.vendor}: "${a.documento}" — ${cuando}. ${a.nota || ''}`.trim());
  }
  console.warn(`[fuentes] ${avisos.length} fuente(s) piden revisión. Detalle por fabricante en /api/fuentes.`);
}

async function start() {
  await sequelize.sync();
  await seedCatalog();
  avisarDeFuentes();
  // Sin contrasena no se puede autenticar a nadie: se falla cerrado en produccion en lugar
  // de arrancar un sitio con precios abierto al publico.
  if (!auth.hashVigente()) {
    const msg = 'Sin administrador utilizable (falta AUTH_PASSWORD o el archivo de usuarios): nadie podra iniciar sesion.';
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(`[aviso] ${msg}`);
  }
  app.listen(PORT, () => {
    console.log(`Presales corriendo en http://localhost:${PORT}`);
  });
}

start();

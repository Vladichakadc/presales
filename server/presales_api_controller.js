/**
 * @file presales_api_controller.js
 * @description Controlador y Rutas Backend Express v4 + Sequelize/SQLite + ExcelJS
 * para el proyecto https://github.com/Vladichakadc/presales (server/).
 * Expone endpoints REST para cálculo de dimensionamiento Carrier-Grade, consolidación de BOM
 * multi-sede, importación validada de catálogos, exportación profesional a Excel (.xlsx) y
 * generación de Memoria Técnica.
 */

'use strict';

const sizingEngine = require('../public/js/sizing_engine');

const FABRICANTES_IMPORTABLES = ['HUAWEI', 'ARUBA'];

function createPresalesHandlers(dependencies = {}) {
  const { ProductModel = null, ExcelJS = null, vendorIds = {} } = dependencies;

  async function handleHuaweiSizing(req, res) {
    try {
      const params = req.body || {};
      const resultado = sizingEngine.dimensionarHuaweiNetEngine(params);
      const finanzas = sizingEngine.calcularSimuladorFinancieroTelco(
        {
          capexListaTotalUsd: resultado.resumenCostosLista.totalCapexUsd,
          opexListaTotalUsd: resultado.resumenCostosLista.totalOpexUsd
        },
        params.finanzas || { meses_contrato: (Number(params.plazo_anios) || 3) * 12, nivel_partner: 'GOLD', total_sedes: 1 }
      );

      return res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        data: {
          ...resultado,
          simulacionFinanciera: finanzas
        }
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: 'Error en cálculo de dimensionamiento Huawei NetEngine',
        details: error.message
      });
    }
  }

  async function handleArubaSizing(req, res) {
    try {
      const params = req.body || {};
      const resultado = sizingEngine.dimensionarArubaEdgeConnect(params);
      const finanzas = sizingEngine.calcularSimuladorFinancieroTelco(
        {
          capexListaTotalUsd: resultado.resumenCostosLista.totalCapexUsd,
          opexListaTotalUsd: resultado.resumenCostosLista.totalOpexUsd
        },
        params.finanzas || { meses_contrato: (Number(params.plazo_anios) || 3) * 12, nivel_partner: 'GOLD', total_sedes: 1 }
      );

      return res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        data: {
          ...resultado,
          simulacionFinanciera: finanzas
        }
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: 'Error en cálculo de dimensionamiento HPE Aruba EdgeConnect',
        details: error.message
      });
    }
  }

  async function handleRolloutConsolidation(req, res) {
    try {
      const { perfiles_sede = [], parametros_financieros = {} } = req.body || {};
      if (!Array.isArray(perfiles_sede) || perfiles_sede.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'Debe proporcionar al menos un perfil en perfiles_sede[]'
        });
      }

      const consolidado = sizingEngine.consolidarRolloutMultiSede(perfiles_sede);
      const simulacionFinanciera = sizingEngine.calcularSimuladorFinancieroTelco(
        consolidado.totalesLista,
        {
          ...parametros_financieros,
          total_sedes: consolidado.totalSedesProyecto
        }
      );

      return res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        data: {
          ...consolidado,
          simulacionFinanciera
        }
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: 'Error al consolidar rollout multi-sede',
        details: error.message
      });
    }
  }

  async function handleCatalogImport(req, res) {
    try {
      const { fabricante, items = [] } = req.body || {};
      if (typeof fabricante !== 'string' || !FABRICANTES_IMPORTABLES.includes(fabricante.toUpperCase())) {
        return res.status(400).json({ ok: false, error: 'fabricante no permitido: ' + FABRICANTES_IMPORTABLES.join(', ') });
      }
      if (!fabricante || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'Se requiere fabricante e items[] no vacío para importar catálogo'
        });
      }

      const validados = [];
      const rechazados = [];

      items.forEach((item, index) => {
        const precio = item && item.list_price_usd != null ? Number(item.list_price_usd) : null;
        if (!item || !item.sku || !item.modelo || (precio !== null && !(precio >= 0))) {
          rechazados.push({ index, sku: (item && item.sku) || null, motivo: 'SKU, modelo o precio inválido' });
        } else {
          validados.push({
            vendorId: vendorIds[fabricante.toUpperCase()],
            category: item.segmento || 'General',
            model: String(item.modelo).trim(),
            specs: item,
            priceNumeric: precio // null = sin dato (no se inventa)
          });
        }
      });

      let persistidosEnDb = 0;
      // Solo persiste si se conoce el vendorId real del fabricante (Product.vendorId es obligatorio).
      if (ProductModel && vendorIds[fabricante.toUpperCase()] && validados.length > 0) {
        const result = await ProductModel.bulkCreate(validados, {
          updateOnDuplicate: ['category', 'specs', 'priceNumeric']
        });
        persistidosEnDb = result.length;
      }

      return res.status(200).json({
        ok: true,
        resumen: {
          fabricante: fabricante.toUpperCase(),
          recibidos: items.length,
          validados: validados.length,
          rechazados: rechazados.length,
          persistidosEnDb
        },
        rechazados
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'Error al importar catálogo en base de datos',
        details: error.message
      });
    }
  }

  async function handleMemoriaTecnicaExport(req, res) {
    try {
      const { fabricante = 'ARUBA', parametros = {}, datos_proyecto = {} } = req.body || {};
      const resultado =
        fabricante.toUpperCase() === 'HUAWEI'
          ? sizingEngine.dimensionarHuaweiNetEngine(parametros)
          : sizingEngine.dimensionarArubaEdgeConnect(parametros);

      const markdown = sizingEngine.generarMemoriaTecnica(resultado, datos_proyecto);

      return res.status(200).json({
        ok: true,
        fabricante: resultado.fabricante,
        modelo: resultado.equipoSeleccionado.modelo,
        formato: 'MARKDOWN',
        contenido: markdown
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'Error al generar la Memoria Técnica de Ingeniería',
        details: error.message
      });
    }
  }

  async function buildBomExcelWorkbook(payload = {}, excelLib = ExcelJS) {
    const lib = excelLib || (() => {
      try {
        return require('exceljs');
      } catch (_e) {
        return null;
      }
    })();

    const fabricante = (payload.fabricante || 'ARUBA').toUpperCase();
    const resultado =
      fabricante === 'HUAWEI'
        ? sizingEngine.dimensionarHuaweiNetEngine(payload.parametros || {})
        : sizingEngine.dimensionarArubaEdgeConnect(payload.parametros || {});

    const finanzas = sizingEngine.calcularSimuladorFinancieroTelco(
      {
        capexListaTotalUsd: resultado.resumenCostosLista.totalCapexUsd,
        opexListaTotalUsd: resultado.resumenCostosLista.totalOpexUsd
      },
      payload.parametros_financieros || { meses_contrato: 36, nivel_partner: 'GOLD', total_sedes: 1 }
    );

    const estructuraHojas = {
      resumenIngenieria: {
        fabricante: resultado.fabricante,
        modeloRecomendado: resultado.equipoSeleccionado.modelo,
        skuChasis: resultado.equipoSeleccionado.sku,
        throughputDisenoMbps: resultado.requerimientos.throughputDisenoMbps,
        totalCapexListaUsd: resultado.resumenCostosLista.totalCapexUsd,
        totalOpexListaUsd: resultado.resumenCostosLista.totalOpexUsd
      },
      hojaBOM: resultado.bom.map((item) => ({
        categoria: item.categoria,
        sku: item.sku,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario_usd: item.precio_unitario_usd,
        subtotal_usd: item.cantidad * item.precio_unitario_usd
      })),
      hojaFinanciera: finanzas
    };

    if (!lib) {
      return { modo: 'JSON_FALLBACK', estructuraHojas };
    }

    const workbook = new lib.Workbook();
    workbook.creator = 'Presales Engineering Suite (Gemini + Claude Sync)';
    workbook.created = new Date();

    const wsBom = workbook.addWorksheet('BOM Oficial');
    wsBom.columns = [
      { header: 'Categoría', key: 'categoria', width: 32 },
      { header: 'SKU / P/N Oficial', key: 'sku', width: 24 },
      { header: 'Descripción Técnica', key: 'descripcion', width: 58 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Precio Lista Unit. (USD)', key: 'precio_unitario_usd', width: 22 },
      { header: 'Subtotal Lista (USD)', key: 'subtotal_usd', width: 22 }
    ];
    estructuraHojas.hojaBOM.forEach((row) => wsBom.addRow(row));

    const wsFin = workbook.addWorksheet('Simulador MRR Telco');
    wsFin.columns = [
      { header: 'Indicador Financiero', key: 'indicador', width: 40 },
      { header: 'Valor', key: 'valor', width: 25 }
    ];
    wsFin.addRows([
      { indicador: 'Plazo de Contrato (Meses)', valor: finanzas.mesesContrato },
      { indicador: 'Nivel de Partner', valor: `${finanzas.nivelPartner} (${finanzas.descuentoAplicadoPct}% Desc.)` },
      { indicador: 'CAPEX Hardware Neto (USD)', valor: finanzas.capexHardwareNetoUsd },
      { indicador: 'OPEX Suscripción/Soporte Neto (USD)', valor: finanzas.opexSuscripcionNetoTotalUsd },
      { indicador: 'Cuota Mensual Total MRR (USD)', valor: finanzas.desgloseMensualUsd.cuotaMensualMrrTotalUsd },
      { indicador: 'Canon Mensual por Sede (USD)', valor: finanzas.desgloseMensualUsd.canonMensualPorSedeUsd },
      { indicador: 'Total Contract Value - TCV (USD)', valor: finanzas.totalContractValueTcvUsd }
    ]);

    return { modo: 'EXCELJS_WORKBOOK', workbook, estructuraHojas };
  }

  return {
    handleHuaweiSizing,
    handleArubaSizing,
    handleRolloutConsolidation,
    handleCatalogImport,
    handleMemoriaTecnicaExport,
    buildBomExcelWorkbook
  };
}

function createPresalesRouter(express, dependencies = {}) {
  const { requireAdmin = null, ProductModel = null } = dependencies;
  // Escribe en la base: sin middleware de admin, no se monta con un modelo real.
  if (ProductModel && typeof requireAdmin !== 'function') {
    throw new Error('createPresalesRouter: con ProductModel se requiere dependencies.requireAdmin (middleware)');
  }
  const router = express.Router();
  const handlers = createPresalesHandlers(dependencies);

  router.post('/sizing/huawei', handlers.handleHuaweiSizing);
  router.post('/sizing/aruba', handlers.handleArubaSizing);
  router.post('/rollout/consolidate', handlers.handleRolloutConsolidation);
  router.post('/catalog/import', ...(requireAdmin ? [requireAdmin] : []), handlers.handleCatalogImport);
  router.post('/export/memoria-tecnica', handlers.handleMemoriaTecnicaExport);

  return router;
}

module.exports = {
  createPresalesHandlers,
  createPresalesRouter
};

'use strict';
// Referencias de pedido de cada equipo FortiGate: hardware, bundles de FortiCare/FortiGuard,
// licencias y SaaS, con su descripcion y su precio de lista.
//
// GENERADO por scripts/importar-skus-fortinet.js desde la price list oficial
// "2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx" (AMER, vigente desde el 07-sep-2026), la
// misma que ya respalda los precios de cotizadorCatalog.js. NO SE EDITA A MANO: se regenera
// pasando la lista nueva al importador, que ancla cada bloque contra el hwSku y el precio ya
// verificados antes de aceptarlo.
//
// El precio (`p`) es de lista y excluye descuentos de canal, impuestos y promociones — la misma
// advertencia que el resto del catalogo. `t` es el tipo que declara el documento: HW, Service
// o SaaS.
//
// Fecha de extraccion: 2026-09-09 · 6849 referencias sobre 54 equipos.

module.exports = {
 "FortiGate 30G": [
  {
   "sku": "FG-30G",
   "d": "HW FG-30G",
   "p": 697,
   "t": "HW"
  },
  {
   "sku": "FG-30G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1122,
   "t": "HW"
  },
  {
   "sku": "FG-30G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1844.5,
   "t": "HW"
  },
  {
   "sku": "FG-30G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2503.25,
   "t": "HW"
  },
  {
   "sku": "FG-30G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1047,
   "t": "HW"
  },
  {
   "sku": "FG-30G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1642,
   "t": "HW"
  },
  {
   "sku": "FG-30G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 2184.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG30G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 425,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1147.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1806.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 945,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1487.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 225,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 607.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 956.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 100,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 500,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 450,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 100,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 500,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 150,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 100,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 500,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 525,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 875,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 100,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 500,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 450,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 287.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 862.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1437.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG30G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 225,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 375,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 100,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 500,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 125,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 375,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 625,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 125,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 112.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG30G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 187.5,
   "t": "Service"
  }
 ],
 "FortiGate 31G": [
  {
   "sku": "FG-31G",
   "d": "HW FG-31G",
   "p": 876,
   "t": "HW"
  },
  {
   "sku": "FG-31G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1365.6,
   "t": "HW"
  },
  {
   "sku": "FG-31G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2197.92,
   "t": "HW"
  },
  {
   "sku": "FG-31G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2956.8,
   "t": "HW"
  },
  {
   "sku": "FG-31G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1279.2,
   "t": "HW"
  },
  {
   "sku": "FG-31G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1964.64,
   "t": "HW"
  },
  {
   "sku": "FG-31G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 2589.6,
   "t": "HW"
  },
  {
   "sku": "FC-10-GT31G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 489.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1321.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2080.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 403.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1088.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1713.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 259.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 699.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1101.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 115.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 345.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 576,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 172.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 518.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 864,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 115.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 345.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 576,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 172.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 518.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 864,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 115.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 345.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 576,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 288,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 864,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1440,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 201.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 604.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1008,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 115.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 345.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 576,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 172.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 518.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 864,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 331.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 993.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1656,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1845.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2536.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3228,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT31G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 86.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 259.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 432,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 115.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 345.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 576,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 144,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 432,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 720,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 28.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 86.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 144,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 129.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT31G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 216,
   "t": "Service"
  }
 ],
 "FortiGate 50G": [
  {
   "sku": "FG-50G",
   "d": "HW FG-50G",
   "p": 1093,
   "t": "HW"
  },
  {
   "sku": "FG-50G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1705.85,
   "t": "HW"
  },
  {
   "sku": "FG-50G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2747.7,
   "t": "HW"
  },
  {
   "sku": "FG-50G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3697.61,
   "t": "HW"
  },
  {
   "sku": "FG-50G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1597.7,
   "t": "HW"
  },
  {
   "sku": "FG-50G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 2455.69,
   "t": "HW"
  },
  {
   "sku": "FG-50G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 3237.98,
   "t": "HW"
  },
  {
   "sku": "FC-10-GT50G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 612.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1654.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2604.61,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 504.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1362.69,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2144.98,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 324.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 876.02,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1378.91,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 144.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 432.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 721,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 216.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 648.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1081.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 144.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 432.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 721,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 216.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 648.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1081.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 144.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 432.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 721,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 360.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1081.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1802.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 252.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 757.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1261.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 252.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 757.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1261.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 144.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 432.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 721,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 216.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 648.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1081.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 414.58,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1243.73,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 2072.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1932.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2797.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3663,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT50G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 108.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 324.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 540.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 144.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 432.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 721,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 180.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 540.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 901.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 36.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 108.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 180.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 54.08,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 162.23,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT50G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 270.38,
   "t": "Service"
  },
  {
   "sku": "FG-50G-5G",
   "d": "HW FG-50G-5G",
   "p": 2380,
   "t": "HW"
  },
  {
   "sku": "FG-50G-5G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3712.8,
   "t": "HW"
  },
  {
   "sku": "FG-50G-5G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5978.56,
   "t": "HW"
  },
  {
   "sku": "FG-50G-5G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 8044.4,
   "t": "HW"
  },
  {
   "sku": "FG-50G-5G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3477.6,
   "t": "HW"
  },
  {
   "sku": "FG-50G-5G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 5343.52,
   "t": "HW"
  },
  {
   "sku": "FG-50G-5G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 7044.8,
   "t": "HW"
  },
  {
   "sku": "FC-10-F50G5-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1332.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3598.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 5664.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1097.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2963.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 4664.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 705.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1905.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2998.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 313.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 940.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1568,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 470.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1411.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2352,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 313.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 940.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1568,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 470.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1411.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2352,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-159-02-12",
   "d": "1 Year IS SVC",
   "p": 313.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-159-02-36",
   "d": "3 Year IS SVC",
   "p": 940.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1568,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 784,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2352,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 548.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1646.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2744,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 548.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1646.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2744,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 313.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 940.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1568,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 470.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1411.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2352,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 901.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2704.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 4508,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2440.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 4322.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 6204,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50G5-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 78.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 235.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 705.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1176,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 313.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 940.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1568,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 392,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1176,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 78.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 235.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 392,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 117.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 352.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50G5-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 588,
   "t": "Service"
  },
  {
   "sku": "FG-50G-DSL",
   "d": "HW FG-50G-DSL",
   "p": 1469,
   "t": "HW"
  },
  {
   "sku": "FG-50G-DSL-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2291.8,
   "t": "HW"
  },
  {
   "sku": "FG-50G-DSL-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3690.56,
   "t": "HW"
  },
  {
   "sku": "FG-50G-DSL-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4965.9,
   "t": "HW"
  },
  {
   "sku": "FG-50G-DSL-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2146.6,
   "t": "HW"
  },
  {
   "sku": "FG-50G-DSL-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 3298.52,
   "t": "HW"
  },
  {
   "sku": "FG-50G-DSL-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 4348.8,
   "t": "HW"
  },
  {
   "sku": "FC-10-F50GD-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 822.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2221.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 3496.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 677.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1829.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2879.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 435.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1176.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1851.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 193.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 580.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 968,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 290.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 871.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1452,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 193.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 580.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 968,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 290.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1452,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-159-02-12",
   "d": "1 Year IS SVC",
   "p": 193.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-159-02-36",
   "d": "3 Year IS SVC",
   "p": 580.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-159-02-60",
   "d": "5 Year IS SVC",
   "p": 968,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 484,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1452,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2420,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 338.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1016.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1694,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 338.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1016.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1694,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 193.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 580.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 968,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 290.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 871.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1452,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 556.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1669.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 2783,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2080.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3242.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 4404,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GD-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 145.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 435.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 193.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 580.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 968,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1210,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 48.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 145.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 72.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 217.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GD-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 363,
   "t": "Service"
  },
  {
   "sku": "FG-50G-SFP",
   "d": "HW FG-50G-SFP",
   "p": 1195,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1863.95,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3001.17,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4038.04,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1745.9,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 2682.43,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 3536.33,
   "t": "HW"
  },
  {
   "sku": "FC-10-F50GS-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 668.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1806.17,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2843.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 550.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1487.43,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2341.33,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 354.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 956.21,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1505.14,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 236.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 708.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1180.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 236.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 708.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1180.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-159-02-12",
   "d": "1 Year IS SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-159-02-36",
   "d": "3 Year IS SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-159-02-60",
   "d": "5 Year IS SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 393.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1180.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1967.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 275.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 826.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1377.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 275.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 826.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1377.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 236.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 708.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1180.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 452.53,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1357.58,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 2262.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1972.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2916.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3861,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GS-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 118.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 354.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 590.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 196.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 590.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 983.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 39.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 118.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 196.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 59.03,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 177.08,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GS-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 295.13,
   "t": "Service"
  },
  {
   "sku": "FG-50G-SFP-POE",
   "d": "HW FG-50G-SFP-POE",
   "p": 1837,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-POE-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2865.5,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-POE-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4613.95,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-POE-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 6208.13,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-POE-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2684,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-POE-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 4123.9,
   "t": "HW"
  },
  {
   "sku": "FG-50G-SFP-POE-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 5436.75,
   "t": "HW"
  },
  {
   "sku": "FC-10-F50GP-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1028.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2776.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 4371.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 847,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2286.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3599.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 544.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1470.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2314.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1210,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 363,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1089,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1815,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1210,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 363,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1815,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-159-02-12",
   "d": "1 Year IS SVC",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-159-02-36",
   "d": "3 Year IS SVC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1210,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 605,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1815,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3025,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 423.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1270.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2117.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 423.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1270.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2117.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1210,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 363,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1089,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1815,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 695.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2087.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 3478.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2226,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3678,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 5130,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F50GP-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 60.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 181.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 544.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 907.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 242,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 726,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1210,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 302.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 907.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1512.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 60.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 181.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 302.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 90.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 272.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F50GP-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 453.75,
   "t": "Service"
  }
 ],
 "FortiGate 51G": [
  {
   "sku": "FG-51G",
   "d": "HW FG-51G",
   "p": 1246,
   "t": "HW"
  },
  {
   "sku": "FG-51G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1914.95,
   "t": "HW"
  },
  {
   "sku": "FG-51G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3052.17,
   "t": "HW"
  },
  {
   "sku": "FG-51G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4089.04,
   "t": "HW"
  },
  {
   "sku": "FG-51G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1796.9,
   "t": "HW"
  },
  {
   "sku": "FG-51G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 2733.43,
   "t": "HW"
  },
  {
   "sku": "FG-51G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 3587.33,
   "t": "HW"
  },
  {
   "sku": "FC-10-GT51G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 668.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1806.17,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2843.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 550.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1487.43,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2341.33,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 354.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 956.21,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1505.14,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 236.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 708.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1180.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 236.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 708.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1180.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 393.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1180.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1967.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 275.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 826.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1377.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 275.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 826.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1377.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 236.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 708.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1180.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 452.53,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1357.58,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 2262.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1972.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2916.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3861,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT51G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 118.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 354.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 590.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 472.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 787,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 196.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 590.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 983.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 39.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 118.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 196.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 59.03,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 177.08,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT51G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 295.13,
   "t": "Service"
  },
  {
   "sku": "FG-51G-5G",
   "d": "HW FG-51G-5G",
   "p": 2664,
   "t": "HW"
  },
  {
   "sku": "FG-51G-5G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4093.7,
   "t": "HW"
  },
  {
   "sku": "FG-51G-5G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 6524.19,
   "t": "HW"
  },
  {
   "sku": "FG-51G-5G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 8740.23,
   "t": "HW"
  },
  {
   "sku": "FG-51G-5G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3841.4,
   "t": "HW"
  },
  {
   "sku": "FG-51G-5G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 5842.98,
   "t": "HW"
  },
  {
   "sku": "FG-51G-5G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 7667.95,
   "t": "HW"
  },
  {
   "sku": "FC-10-F51G5-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1429.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3860.19,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 6076.23,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1177.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 3178.98,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 5003.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 756.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 2043.63,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 3216.83,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 336.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1009.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1682,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 504.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1513.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2523,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 336.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1009.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1682,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 504.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1513.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2523,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-159-02-12",
   "d": "1 Year IS SVC",
   "p": 336.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1009.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1682,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 841,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2523,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 4205,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 588.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1766.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2943.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 588.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1766.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2943.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 336.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1009.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1682,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 504.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1513.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2523,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 967.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2901.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 4835.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2509.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 4527.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 6546,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51G5-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 84.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 252.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 756.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1261.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 336.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1009.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1682,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 420.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1261.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 2102.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 84.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 252.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 420.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 126.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 378.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51G5-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 630.75,
   "t": "Service"
  },
  {
   "sku": "FG-51G-SFP-POE",
   "d": "HW FG-51G-SFP-POE",
   "p": 2108,
   "t": "HW"
  },
  {
   "sku": "FG-51G-SFP-POE-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3239.35,
   "t": "HW"
  },
  {
   "sku": "FG-51G-SFP-POE-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5162.65,
   "t": "HW"
  },
  {
   "sku": "FG-51G-SFP-POE-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 6916.24,
   "t": "HW"
  },
  {
   "sku": "FG-51G-SFP-POE-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3039.7,
   "t": "HW"
  },
  {
   "sku": "FG-51G-SFP-POE-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 4623.59,
   "t": "HW"
  },
  {
   "sku": "FG-51G-SFP-POE-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 6067.73,
   "t": "HW"
  },
  {
   "sku": "FC-10-F51GP-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1131.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3054.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 4808.24,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 931.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2515.59,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3959.73,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 598.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1617.17,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2545.54,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 266.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 798.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1331,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 399.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1197.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1996.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 266.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 798.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1331,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 399.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1197.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1996.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-159-02-12",
   "d": "1 Year IS SVC",
   "p": 266.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-159-02-36",
   "d": "3 Year IS SVC",
   "p": 798.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1331,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 665.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1996.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3327.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 465.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1397.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2329.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 465.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1397.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2329.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 266.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 798.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1331,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 399.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1197.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1996.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 765.33,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2295.98,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 3826.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2298.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3895.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 5493,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F51GP-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 66.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 199.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 598.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 998.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 266.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 798.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1331,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 332.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 998.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1663.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 66.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 199.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 332.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 99.83,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 299.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-F51GP-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 499.13,
   "t": "Service"
  }
 ],
 "FortiGate 70G": [
  {
   "sku": "FG-70G",
   "d": "HW FG-70G",
   "p": 1562,
   "t": "HW"
  },
  {
   "sku": "FG-70G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2498.7,
   "t": "HW"
  },
  {
   "sku": "FG-70G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4091.09,
   "t": "HW"
  },
  {
   "sku": "FG-70G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5542.98,
   "t": "HW"
  },
  {
   "sku": "FG-70G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2333.4,
   "t": "HW"
  },
  {
   "sku": "FG-70G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 3644.78,
   "t": "HW"
  },
  {
   "sku": "FG-70G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 4840.45,
   "t": "HW"
  },
  {
   "sku": "FC-10-GT70G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 936.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2529.09,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 3980.98,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 771.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2082.78,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3278.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 495.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1338.93,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2107.58,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 220.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1102,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 330.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 991.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1653,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 220.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1102,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 330.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 991.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1653,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 220.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1102,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 551,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1653,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2755,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 385.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1157.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1928.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 385.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1157.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1928.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 220.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1102,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 330.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 991.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1653,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 633.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1900.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 3168.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2161.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3483.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 4806,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT70G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 55.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 165.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 495.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 826.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 220.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1102,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 275.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 826.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1377.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 55.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 165.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 275.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 82.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 247.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT70G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 413.25,
   "t": "Service"
  },
  {
   "sku": "FG-70G-POE",
   "d": "HW FG-70G-POE",
   "p": 1982,
   "t": "HW"
  },
  {
   "sku": "FG-70G-POE-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3170.3,
   "t": "HW"
  },
  {
   "sku": "FG-70G-POE-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5190.41,
   "t": "HW"
  },
  {
   "sku": "FG-70G-POE-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 7032.28,
   "t": "HW"
  },
  {
   "sku": "FG-70G-POE-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2960.6,
   "t": "HW"
  },
  {
   "sku": "FG-70G-POE-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 4624.22,
   "t": "HW"
  },
  {
   "sku": "FG-70G-POE-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 6141.05,
   "t": "HW"
  },
  {
   "sku": "FC-10-G70GP-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1188.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3208.41,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 5050.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 978.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2642.22,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 4159.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 629.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1698.57,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2673.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 279.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 838.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1398,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 419.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1258.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2097,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 279.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 838.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1398,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 419.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1258.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2097,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-159-02-12",
   "d": "1 Year IS SVC",
   "p": 279.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-159-02-36",
   "d": "3 Year IS SVC",
   "p": 838.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1398,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 699,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2097,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3495,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 489.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1467.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2446.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 489.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1467.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2446.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 279.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 838.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1398,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 419.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1258.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2097,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 803.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2411.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 4019.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2338.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 4016.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 5694,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G70GP-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 69.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 209.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 629.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1048.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 279.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 838.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1398,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 349.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1048.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1747.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 69.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 209.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 349.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 104.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 314.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-G70GP-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 524.25,
   "t": "Service"
  }
 ],
 "FortiGate 71G": [
  {
   "sku": "FG-71G",
   "d": "HW FG-71G",
   "p": 1823,
   "t": "HW"
  },
  {
   "sku": "FG-71G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2916.1,
   "t": "HW"
  },
  {
   "sku": "FG-71G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4774.37,
   "t": "HW"
  },
  {
   "sku": "FG-71G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 6468.68,
   "t": "HW"
  },
  {
   "sku": "FG-71G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2723.2,
   "t": "HW"
  },
  {
   "sku": "FG-71G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 4253.54,
   "t": "HW"
  },
  {
   "sku": "FG-71G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 5648.85,
   "t": "HW"
  },
  {
   "sku": "FC-10-GT71G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1093.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2951.37,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 4645.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 900.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2430.54,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3825.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 578.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1562.49,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2459.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 257.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 771.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1286,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 385.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1157.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1929,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 257.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 771.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1286,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 385.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1157.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1929,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 257.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 771.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1286,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 643,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1929,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3215,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 450.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1350.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2250.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 450.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1350.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2250.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 257.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 771.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1286,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 385.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1157.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1929,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 739.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2218.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 3697.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2271.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3814.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 5358,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-GT71G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 64.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 192.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 578.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 964.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 257.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 771.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1286,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 321.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 964.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1607.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 64.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 192.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 321.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 96.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 289.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-GT71G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 482.25,
   "t": "Service"
  },
  {
   "sku": "FG-71G-POE",
   "d": "HW FG-71G-POE",
   "p": 2259,
   "t": "HW"
  },
  {
   "sku": "FG-71G-POE-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3613.9,
   "t": "HW"
  },
  {
   "sku": "FG-71G-POE-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5917.23,
   "t": "HW"
  },
  {
   "sku": "FG-71G-POE-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 8017.33,
   "t": "HW"
  },
  {
   "sku": "FG-71G-POE-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3374.8,
   "t": "HW"
  },
  {
   "sku": "FG-71G-POE-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 5271.66,
   "t": "HW"
  },
  {
   "sku": "FG-71G-POE-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 7001.15,
   "t": "HW"
  },
  {
   "sku": "FC-10-G71GP-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1354.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3658.23,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 5758.33,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1115.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 3012.66,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 4742.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 717.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1936.71,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 3048.53,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 318.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 956.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1594,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 478.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1434.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2391,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 318.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 956.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1594,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 478.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1434.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2391,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-159-02-12",
   "d": "1 Year IS SVC",
   "p": 318.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-159-02-36",
   "d": "3 Year IS SVC",
   "p": 956.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1594,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 797,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2391,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3985,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 557.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1673.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2789.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 557.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1673.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2789.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 318.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 956.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1594,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 478.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1434.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2391,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 916.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2749.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 4582.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2456.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 4369.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 6282,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G71GP-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 79.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 239.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 717.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1195.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 318.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 956.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1594,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 398.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1195.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1992.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 79.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 239.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 398.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 119.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 358.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-G71GP-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 597.75,
   "t": "Service"
  }
 ],
 "FortiGate 90G": [
  {
   "sku": "FG-90G",
   "d": "HW FG-90G",
   "p": 3638,
   "t": "HW"
  },
  {
   "sku": "FC-10-0090G-1082-02-12",
   "d": "1 Year  Sovereign SASE Security",
   "p": 1229.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-1082-02-36",
   "d": "3 Year  Sovereign SASE Security",
   "p": 3688.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-1082-02-60",
   "d": "5 Year  Sovereign SASE Security",
   "p": 6147,
   "t": "Service"
  },
  {
   "sku": "FG-90G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 4867.4,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 7326.2,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-1082-60",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 9785,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5960.2,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 10604.6,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 15249,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 5550.4,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 9375.2,
   "t": "HW"
  },
  {
   "sku": "FG-90G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 13200,
   "t": "HW"
  },
  {
   "sku": "FC-10-0090G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 2322.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 6966.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 11611,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1912.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 5737.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 9562,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 1229.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 3688.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 6147,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 546.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1639.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 2732,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 819.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 2458.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 4098,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 546.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1639.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 2732,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 819.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 2458.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 4098,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 546.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1639.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 2732,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1366,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 4098,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 6830,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 956.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2868.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 4781,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 956.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 2868.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 4781,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 546.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1639.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 2732,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 819.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 2458.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 4098,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 1570.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 4712.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 7854.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 3139.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 6417.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 9696,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0090G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 136.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 409.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 1229.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 2049,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 546.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1639.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 2732,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 2049,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 3415,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 136.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 409.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 601.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1803.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 3005.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 204.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 614.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0090G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 1024.5,
   "t": "Service"
  }
 ],
 "FortiGate 91G": [
  {
   "sku": "FC1-10-G091G-1161-02-12",
   "d": "1 Year FGaaS Enterprise",
   "p": 9193.13,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1161-02-36",
   "d": "3 Year FGaaS Enterprise",
   "p": 27579.39,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1161-02-60",
   "d": "5 Year FGaaS Enterprise",
   "p": 45965.65,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1162-02-12",
   "d": "1 Year FGaaS UTP",
   "p": 8810.63,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1162-02-36",
   "d": "3 Year FGaaS UTP",
   "p": 26431.89,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1162-02-60",
   "d": "5 Year FGaaS UTP",
   "p": 44053.15,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1160-02-12",
   "d": "1 Year FGaaS FC with Bandwidth IP 2",
   "p": 7535.63,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1160-02-36",
   "d": "3 Year FGaaS FC with Bandwidth IP 2",
   "p": 22606.89,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1160-02-60",
   "d": "5 Year FGaaS FC with Bandwidth IP 2",
   "p": 37678.15,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1164-02-12",
   "d": "1 Year FGaaS Enterprise IP 3",
   "p": 16636.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1164-02-36",
   "d": "3 Year FGaaS Enterprise IP 3",
   "p": 49908.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1164-02-60",
   "d": "5 Year FGaaS Enterprise IP 3",
   "p": 83181.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1165-02-12",
   "d": "1 Year FGaaS UTP IP 3",
   "p": 15871.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1165-02-36",
   "d": "3 Year FGaaS UTP IP 3",
   "p": 47613.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1165-02-60",
   "d": "5 Year FGaaS UTP IP 3",
   "p": 79356.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1163-02-12",
   "d": "1 Year FGaaS FC with Bandwidth IP 3",
   "p": 13321.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1163-02-36",
   "d": "3 Year FGaaS FC with Bandwidth IP 3",
   "p": 39963.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1163-02-60",
   "d": "5 Year FGaaS FC with Bandwidth IP 3",
   "p": 66606.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1182-02-12",
   "d": "1 Year FortiCare Premium Upgrade for FGAAS",
   "p": 128,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1182-02-36",
   "d": "3 Year FortiCare Premium Upgrade for FGAAS",
   "p": 384,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1182-02-60",
   "d": "5 Year FortiCare Premium Upgrade for FGAAS",
   "p": 640,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1185-02-12",
   "d": "1 Year FortiCare Premium Upgrade for FGAAS",
   "p": 256,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1185-02-36",
   "d": "3 Year FortiCare Premium Upgrade for FGAAS",
   "p": 768,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G091G-1185-02-60",
   "d": "5 Year FortiCare Premium Upgrade for FGAAS",
   "p": 1280,
   "t": "Service"
  },
  {
   "sku": "FG-91G",
   "d": "HW FG-91G",
   "p": 4314,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 7068.85,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 12578.55,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 18088.25,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 6582.7,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 11120.1,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 15657.5,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 5772.45,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 8689.35,
   "t": "HW"
  },
  {
   "sku": "FG-91G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 11606.25,
   "t": "HW"
  },
  {
   "sku": "FC-10-0091G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 2754.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 8264.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 13774.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 2268.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 6806.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 11343.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 1458.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 4375.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 7292.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 1458.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 4375.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 7292.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 648.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1944.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 3241,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 972.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 2916.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 4861.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 648.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1944.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 3241,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 972.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 2916.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 4861.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 648.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1944.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 3241,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1620.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 4861.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 8102.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1134.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 3403.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 5671.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 1134.35,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 3403.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 5671.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 648.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1944.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 3241,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 972.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 2916.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 4861.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 1863.58,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 5590.73,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 9317.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 3444.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 7333.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 11223,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0091G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 162.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 486.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 1458.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 2430.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 648.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1944.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 3241,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 810.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 2430.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 4051.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 162.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 486.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 810.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 388.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1166.76,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1944.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 713.02,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 2139.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 3565.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 243.08,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 729.23,
   "t": "Service"
  },
  {
   "sku": "FC-10-0091G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 1215.38,
   "t": "Service"
  }
 ],
 "FortiGate 120G": [
  {
   "sku": "FG-120G",
   "d": "HW FG-120G",
   "p": 5511,
   "t": "HW"
  },
  {
   "sku": "FG-120G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 8877,
   "t": "HW"
  },
  {
   "sku": "FG-120G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 15609,
   "t": "HW"
  },
  {
   "sku": "FG-120G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 22341,
   "t": "HW"
  },
  {
   "sku": "FG-120G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 8283,
   "t": "HW"
  },
  {
   "sku": "FG-120G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 13827,
   "t": "HW"
  },
  {
   "sku": "FG-120G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 19371,
   "t": "HW"
  },
  {
   "sku": "FC-10-F120G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 3366,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 10098,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 16830,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 2772,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 13860,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 1782,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 5346,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 8910,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 792,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 2376,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 3960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 1188,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 3564,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 5940,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 792,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 2376,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 3960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 1188,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 3564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 5940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 792,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 2376,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 3960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1980,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 5940,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 9900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1386,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 4158,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 6930,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 792,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 2376,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 3960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 1188,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 3564,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 5940,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 2277,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 6831,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 11385,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 3876,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 8628,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 13380,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F120G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 792,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 2376,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 3960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 990,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 2970,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 4950,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 594,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 990,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 475.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1425.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 2376,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 4356,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 297,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 891,
   "t": "Service"
  },
  {
   "sku": "FC-10-F120G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 1485,
   "t": "Service"
  }
 ],
 "FortiGate 121G": [
  {
   "sku": "FG-121G",
   "d": "HW FG-121G",
   "p": 6337,
   "t": "HW"
  },
  {
   "sku": "FG-121G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 10039.6,
   "t": "HW"
  },
  {
   "sku": "FG-121G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 17444.8,
   "t": "HW"
  },
  {
   "sku": "FG-121G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 24850,
   "t": "HW"
  },
  {
   "sku": "FG-121G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 9386.2,
   "t": "HW"
  },
  {
   "sku": "FG-121G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 15484.6,
   "t": "HW"
  },
  {
   "sku": "FG-121G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 21583,
   "t": "HW"
  },
  {
   "sku": "FC-10-F121G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 3702.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 11107.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 18513,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 3049.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 9147.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 15246,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 1960.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 5880.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 9801,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 4356,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 1306.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 3920.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 6534,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 4356,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 1306.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 3920.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 6534,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 4356,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 2178,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 6534,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 10890,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1524.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 4573.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 7623,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 4356,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 1306.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 3920.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 6534,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 2504.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 7514.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 12523.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 4113.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 9340.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 14568,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F121G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 217.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 871.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 4356,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 1089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 3267,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 5445,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 217.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 653.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 522.72,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1568.16,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 2613.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 958.32,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 2874.96,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 4791.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 326.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 980.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F121G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 1633.5,
   "t": "Service"
  },
  {
   "sku": "FG-121G-LENC",
   "d": "HW FG-121G-LENC",
   "p": 6654,
   "t": "HW"
  }
 ],
 "FortiGate 200G": [
  {
   "sku": "FG-200G",
   "d": "HW FG-200G",
   "p": 11477,
   "t": "HW"
  },
  {
   "sku": "FG-200G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 18545.6,
   "t": "HW"
  },
  {
   "sku": "FG-200G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 32682.8,
   "t": "HW"
  },
  {
   "sku": "FG-200G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 46820,
   "t": "HW"
  },
  {
   "sku": "FG-200G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 17298.2,
   "t": "HW"
  },
  {
   "sku": "FG-200G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 28940.6,
   "t": "HW"
  },
  {
   "sku": "FG-200G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 40583,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG2HG-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 7068.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 21205.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 35343,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 5821.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 17463.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 29106,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 3742.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 11226.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 18711,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 1663.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 4989.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 2494.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 7484.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 12474,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 1663.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 4989.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 2494.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 7484.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 12474,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-159-02-12",
   "d": "1 Year IS SVC",
   "p": 1663.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-159-02-36",
   "d": "3 Year IS SVC",
   "p": 4989.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-159-02-60",
   "d": "5 Year IS SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 4158,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 12474,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 20790,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 2910.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 8731.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 14553,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 1663.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 4989.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 2494.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 7484.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 12474,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 4781.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 14345.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 23908.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 5742.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 13226.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 20711,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG2HG-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 415.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 1663.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 4989.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 2079,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 6237,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 10395,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 415.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1247.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2079,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 415.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 1247.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 2079,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 997.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 2993.76,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 4989.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 1829.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 5488.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 9147.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 623.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 1871.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG2HG-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 3118.5,
   "t": "Service"
  }
 ],
 "FortiGate 201G": [
  {
   "sku": "FG-201G",
   "d": "HW FG-201G",
   "p": 12693,
   "t": "HW"
  },
  {
   "sku": "FG-201G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 20511.3,
   "t": "HW"
  },
  {
   "sku": "FG-201G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 36147.9,
   "t": "HW"
  },
  {
   "sku": "FG-201G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 51784.5,
   "t": "HW"
  },
  {
   "sku": "FG-201G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 19131.6,
   "t": "HW"
  },
  {
   "sku": "FG-201G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 32008.8,
   "t": "HW"
  },
  {
   "sku": "FG-201G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 44886,
   "t": "HW"
  },
  {
   "sku": "FC-10-F2H1G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 7818.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 23454.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 39091.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 6438.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 19315.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 32193,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 4139.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 12417.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 20695.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 1839.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 5518.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 9198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 2759.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 8278.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 13797,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 1839.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 5518.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 9198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 2759.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 8278.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 13797,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 1839.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 5518.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 9198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 4599,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 13797,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 22995,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 3219.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 9657.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 16096.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 1839.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 5518.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 9198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 2759.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 8278.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 13797,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 5288.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 15866.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 26444.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 6139.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 14417.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 22695.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F2H1G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 459.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 1839.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 5518.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 9198,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 2299.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 6898.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 11497.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 459.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1379.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2299.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 459.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 1379.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 2299.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 1103.76,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 3311.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 5518.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 2023.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 6070.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 10117.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 689.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 2069.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-F2H1G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 3449.25,
   "t": "Service"
  }
 ],
 "FortiGate 400G": [
  {
   "sku": "FG-400G",
   "d": "HW FG-400G",
   "p": 24696,
   "t": "HW"
  },
  {
   "sku": "FG-400G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 43438.5,
   "t": "HW"
  },
  {
   "sku": "FG-400G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 80923.5,
   "t": "HW"
  },
  {
   "sku": "FG-400G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 118408.5,
   "t": "HW"
  },
  {
   "sku": "FG-400G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 40131,
   "t": "HW"
  },
  {
   "sku": "FG-400G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 71001,
   "t": "HW"
  },
  {
   "sku": "FG-400G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 101871,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG4H0-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 18742.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 56227.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 93712.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 15435,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 46305,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 77175,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 9922.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 29767.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 49612.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 4410,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 13230,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 22050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 6615,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 19845,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 33075,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 4410,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 13230,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 22050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 6615,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 19845,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 33075,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-159-02-12",
   "d": "1 Year IS SVC",
   "p": 4410,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-159-02-36",
   "d": "3 Year IS SVC",
   "p": 13230,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-159-02-60",
   "d": "5 Year IS SVC",
   "p": 22050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 11025,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 33075,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 55125,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 7717.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 23152.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 38587.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 4410,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 13230,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 22050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 6615,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 19845,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 33075,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 12678.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 38036.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 63393.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 11922.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 31767.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 51612.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H0-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1102.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 4410,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 13230,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 22050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 5512.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 16537.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 27562.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1102.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3307.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5512.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1102.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 3307.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 5512.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 2646,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 7938,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 13230,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 4851,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 14553,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 24255,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 1653.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 4961.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H0-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 8268.75,
   "t": "Service"
  }
 ],
 "FortiGate 401G": [
  {
   "sku": "FG-401G",
   "d": "HW FG-401G",
   "p": 27773,
   "t": "HW"
  },
  {
   "sku": "FG-401G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 48300.5,
   "t": "HW"
  },
  {
   "sku": "FG-401G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 89355.5,
   "t": "HW"
  },
  {
   "sku": "FG-401G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 130410.5,
   "t": "HW"
  },
  {
   "sku": "FG-401G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 44678,
   "t": "HW"
  },
  {
   "sku": "FG-401G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 78488,
   "t": "HW"
  },
  {
   "sku": "FG-401G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 112298,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG4H1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 20527.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 61582.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 102637.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 16905,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 50715,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 84525,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 10867.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 32602.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 54337.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 4830,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 14490,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 24150,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 7245,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 21735,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 36225,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 4830,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 14490,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 24150,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 7245,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 21735,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 36225,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 4830,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 14490,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 24150,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 12075,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 36225,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 60375,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 8452.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 25357.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 42262.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 4830,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 14490,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 24150,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 7245,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 21735,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 36225,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 13886.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 41658.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 69431.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 12867.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 34602.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 56337.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG4H1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1207.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 4830,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 14490,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 24150,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 6037.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 18112.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 30187.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1207.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3622.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 6037.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1207.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 3622.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 6037.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 2898,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 8694,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 14490,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 5313,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 15939,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 26565,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 1811.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 5433.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG4H1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 9056.25,
   "t": "Service"
  }
 ],
 "FortiGate 700G": [
  {
   "sku": "FG-700G",
   "d": "HW FG-700G",
   "p": 35066,
   "t": "HW"
  },
  {
   "sku": "FG-700G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 58628,
   "t": "HW"
  },
  {
   "sku": "FG-700G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 105752,
   "t": "HW"
  },
  {
   "sku": "FG-700G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 152876,
   "t": "HW"
  },
  {
   "sku": "FG-700G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 54470,
   "t": "HW"
  },
  {
   "sku": "FG-700G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 93278,
   "t": "HW"
  },
  {
   "sku": "FG-700G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 132086,
   "t": "HW"
  },
  {
   "sku": "FC-10-G7H0G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 23562,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 70686,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 117810,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 19404,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 58212,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 97020,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 12474,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 37422,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 62370,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 5544,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 16632,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 27720,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 8316,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 24948,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 41580,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 5544,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 16632,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 27720,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 24948,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 41580,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 5544,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 16632,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 27720,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 13860,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 41580,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 69300,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 9702,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 29106,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 48510,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 5544,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 16632,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 27720,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 8316,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 24948,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 41580,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 15939,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 47817,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 79695,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 14474,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 39422,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 64370,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H0G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1386,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 5544,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 16632,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 27720,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 6930,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 20790,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 34650,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1386,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 4158,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 6930,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1386,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 4158,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 6930,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 3326.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 9979.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 16632,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 6098.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 18295.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 30492,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 2079,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 6237,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H0G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 10395,
   "t": "Service"
  }
 ],
 "FortiGate 701G": [
  {
   "sku": "FG-701G",
   "d": "HW FG-701G",
   "p": 38254,
   "t": "HW"
  },
  {
   "sku": "FG-701G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 63958,
   "t": "HW"
  },
  {
   "sku": "FG-701G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 115366,
   "t": "HW"
  },
  {
   "sku": "FG-701G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 166774,
   "t": "HW"
  },
  {
   "sku": "FG-701G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 59422,
   "t": "HW"
  },
  {
   "sku": "FG-701G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 101758,
   "t": "HW"
  },
  {
   "sku": "FG-701G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 144094,
   "t": "HW"
  },
  {
   "sku": "FC-10-G7H1G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 25704,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 77112,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 128520,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 21168,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 63504,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 105840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 13608,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 40824,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 68040,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 6048,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 18144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 30240,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 9072,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 27216,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 45360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 6048,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 18144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 30240,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 9072,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 27216,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 45360,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 6048,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 18144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 30240,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 15120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 45360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 75600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 10584,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 31752,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 52920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 6048,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 18144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 30240,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 9072,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 27216,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 45360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 17388,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 52164,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 86940,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 15608,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 42824,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 70040,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G7H1G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1512,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 6048,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 18144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 30240,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1512,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 4536,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1512,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 4536,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 3628.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 10886.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 18144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 6652.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 19958.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 33264,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 2268,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 6804,
   "t": "Service"
  },
  {
   "sku": "FC-10-G7H1G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 11340,
   "t": "Service"
  }
 ],
 "FortiGate 900G": [
  {
   "sku": "FG-900G",
   "d": "HW FG-900G",
   "p": 41580,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG9H0-1082-02-12",
   "d": "1 Year  Sovereign SASE Security",
   "p": 17010,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-1082-02-36",
   "d": "3 Year  Sovereign SASE Security",
   "p": 51030,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-1082-02-60",
   "d": "5 Year  Sovereign SASE Security",
   "p": 85050,
   "t": "Service"
  },
  {
   "sku": "FG-900G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 54810,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 88830,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 122850,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 73710,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 137970,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 202230,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 68040,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 120960,
   "t": "HW"
  },
  {
   "sku": "FG-900G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 173880,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG9H0-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 32130,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 96390,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 160650,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 26460,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 79380,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 132300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 17010,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 51030,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 85050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 11340,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 34020,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 56700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 11340,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 34020,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 56700,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-159-02-12",
   "d": "1 Year IS SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-159-02-36",
   "d": "3 Year IS SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-159-02-60",
   "d": "5 Year IS SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 18900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 56700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 94500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 13230,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 39690,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 66150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 11340,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 34020,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 56700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 21735,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 65205,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 108675,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 19010,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 53030,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 87050,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H0-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1890,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 9450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 28350,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 47250,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1890,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5670,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 9450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1890,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 5670,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 9450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 4536,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 13608,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 24948,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 41580,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 2835,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 8505,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H0-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 14175,
   "t": "Service"
  },
  {
   "sku": "FG-900G-DC",
   "d": "HW FG-900G",
   "p": 41580,
   "t": "HW"
  },
  {
   "sku": "FG-900G-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 73710,
   "t": "HW"
  },
  {
   "sku": "FG-900G-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 137970,
   "t": "HW"
  },
  {
   "sku": "FG-900G-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 202230,
   "t": "HW"
  },
  {
   "sku": "FG-900G-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 68040,
   "t": "HW"
  },
  {
   "sku": "FG-900G-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 120960,
   "t": "HW"
  },
  {
   "sku": "FG-900G-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 173880,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD9H0-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 32130,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 96390,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 160650,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 26460,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 79380,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 132300,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 17010,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 51030,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 85050,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 11340,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 34020,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 56700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 11340,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 34020,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 56700,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-159-02-12",
   "d": "1 Year IS SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-159-02-36",
   "d": "3 Year IS SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-159-02-60",
   "d": "5 Year IS SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 18900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 56700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 94500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 13230,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 39690,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 66150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 11340,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 34020,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 56700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 21735,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 65205,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 108675,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 19010,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 53030,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 87050,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H0-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1890,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 7560,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 9450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 28350,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 47250,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1890,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5670,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 9450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1890,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 5670,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 9450,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 4536,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 13608,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 22680,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 8316,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 24948,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 41580,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 2835,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 8505,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H0-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 14175,
   "t": "Service"
  },
  {
   "sku": "FG-900G-LENC",
   "d": "HW FG-900G-LENC",
   "p": 43659,
   "t": "HW"
  }
 ],
 "FortiGate 901G": [
  {
   "sku": "FC1-10-G0H1G-1161-02-12",
   "d": "1 Year FGaaS Enterprise",
   "p": 44339.06,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1161-02-36",
   "d": "3 Year FGaaS Enterprise",
   "p": 133017.18,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1161-02-60",
   "d": "5 Year FGaaS Enterprise",
   "p": 221695.3,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1162-02-12",
   "d": "1 Year FGaaS UTP",
   "p": 39689.06,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1162-02-36",
   "d": "3 Year FGaaS UTP",
   "p": 119067.18,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1162-02-60",
   "d": "5 Year FGaaS UTP",
   "p": 198445.3,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1160-02-12",
   "d": "1 Year FGaaS FC with Bandwidth IP 2",
   "p": 24189.06,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1160-02-36",
   "d": "3 Year FGaaS FC with Bandwidth IP 2",
   "p": 72567.18,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1160-02-60",
   "d": "5 Year FGaaS FC with Bandwidth IP 2",
   "p": 120945.3,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1164-02-12",
   "d": "1 Year FGaaS Enterprise IP 3",
   "p": 86928.13,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1164-02-36",
   "d": "3 Year FGaaS Enterprise IP 3",
   "p": 260784.39,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1164-02-60",
   "d": "5 Year FGaaS Enterprise IP 3",
   "p": 434640.65,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1165-02-12",
   "d": "1 Year FGaaS UTP IP 3",
   "p": 77628.13,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1165-02-36",
   "d": "3 Year FGaaS UTP IP 3",
   "p": 232884.39,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1165-02-60",
   "d": "5 Year FGaaS UTP IP 3",
   "p": 388140.65,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1163-02-12",
   "d": "1 Year FGaaS FC with Bandwidth IP 3",
   "p": 46628.13,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1163-02-36",
   "d": "3 Year FGaaS FC with Bandwidth IP 3",
   "p": 139884.39,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1163-02-60",
   "d": "5 Year FGaaS FC with Bandwidth IP 3",
   "p": 233140.65,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1182-02-12",
   "d": "1 Year FortiCare Premium Upgrade for FGAAS",
   "p": 1550,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1182-02-36",
   "d": "3 Year FortiCare Premium Upgrade for FGAAS",
   "p": 4650,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1182-02-60",
   "d": "5 Year FortiCare Premium Upgrade for FGAAS",
   "p": 7750,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1185-02-12",
   "d": "1 Year FortiCare Premium Upgrade for FGAAS",
   "p": 3100,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1185-02-36",
   "d": "3 Year FortiCare Premium Upgrade for FGAAS",
   "p": 9300,
   "t": "Service"
  },
  {
   "sku": "FC1-10-G0H1G-1185-02-60",
   "d": "5 Year FortiCare Premium Upgrade for FGAAS",
   "p": 15500,
   "t": "Service"
  },
  {
   "sku": "FG-901G",
   "d": "HW FG-901G",
   "p": 49411,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 82612,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 149014,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 215416,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 76753,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 131437,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 186121,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 66988,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 102142,
   "t": "HW"
  },
  {
   "sku": "FG-901G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 137296,
   "t": "HW"
  },
  {
   "sku": "FC-10-FG9H1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 33201,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 99603,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 166005,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 27342,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 82026,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 136710,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 17577,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 52731,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 87885,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 17577,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 52731,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 87885,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 11718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 35154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 58590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 11718,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 35154,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 58590,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 19530,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 58590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 97650,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 13671,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 41013,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 68355,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 11718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 35154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 58590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 22459.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 67378.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 112297.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 19577,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 54731,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 89885,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FG9H1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1953,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 9765,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 29295,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 48825,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1953,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5859,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 9765,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1953,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 5859,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 9765,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 4687.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 14061.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 8593.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 25779.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 42966,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 2929.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 8788.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FG9H1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 14647.5,
   "t": "Service"
  },
  {
   "sku": "FG-901G-DC",
   "d": "HW FG-901G",
   "p": 49411,
   "t": "HW"
  },
  {
   "sku": "FG-901G-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 82612,
   "t": "HW"
  },
  {
   "sku": "FG-901G-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 149014,
   "t": "HW"
  },
  {
   "sku": "FG-901G-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 215416,
   "t": "HW"
  },
  {
   "sku": "FG-901G-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 76753,
   "t": "HW"
  },
  {
   "sku": "FG-901G-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 131437,
   "t": "HW"
  },
  {
   "sku": "FG-901G-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 186121,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD9H1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 33201,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 99603,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 166005,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 27342,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 82026,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 136710,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 17577,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 52731,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 87885,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 11718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 35154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 58590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 11718,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 35154,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 58590,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 19530,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 58590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 97650,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 13671,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 41013,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 68355,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 11718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 35154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 58590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 22459.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 67378.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 112297.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 19577,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 54731,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 89885,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD9H1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 1953,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 7812,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 39060,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 9765,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 29295,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 48825,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 1953,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5859,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 9765,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 1953,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 5859,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 9765,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 4687.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 14061.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 23436,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 8593.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 25779.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 42966,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 2929.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 8788.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD9H1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 14647.5,
   "t": "Service"
  }
 ],
 "FortiGate 3000G": [
  {
   "sku": "FG-3000G",
   "d": "HWFG-3000G",
   "p": 197789,
   "t": "HW"
  },
  {
   "sku": "FC-10-G3K0G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 81900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 245700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 409500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 57330,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 171990,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 286650,
   "t": "SaaS"
  },
  {
   "sku": "FG-3000G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 271499,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 418919,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 566339,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 337019,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 615479,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 893939,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 312449,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 541769,
   "t": "HW"
  },
  {
   "sku": "FG-3000G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 771089,
   "t": "HW"
  },
  {
   "sku": "FC-10-G3K0G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 139230,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 417690,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 696150,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 73710,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 221130,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 368550,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 114660,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 343980,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 573300,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 73710,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 221130,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 368550,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 32760,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 98280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 163800,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 49140,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 147420,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 245700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 32760,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 98280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 163800,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 49140,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 147420,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 32760,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 98280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 163800,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 32760,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 98280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 163800,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 49140,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 147420,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 245700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 94185,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 282555,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 470925,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 70520,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 201560,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 332600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K0G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 32760,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 98280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 163800,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 40950,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 122850,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 204750,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 8190,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 24570,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 40950,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 8190,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 24570,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 40950,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 19656,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 58968,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 98280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 36036,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 108108,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 180180,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 12285,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 36855,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K0G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 61425,
   "t": "Service"
  }
 ],
 "FortiGate 3001G": [
  {
   "sku": "FG-3001G",
   "d": "HW FG-3001G",
   "p": 212789,
   "t": "HW"
  },
  {
   "sku": "FC-10-G3K1G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 85664,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 256992,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 428320,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 59964.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 179894.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 299824,
   "t": "SaaS"
  },
  {
   "sku": "FG-3001G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 289886.6,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 444081.8,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 598277,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 358417.8,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 649675.4,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 940933,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 332718.6,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 572577.8,
   "t": "HW"
  },
  {
   "sku": "FG-3001G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 812437,
   "t": "HW"
  },
  {
   "sku": "FC-10-G3K1G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 145628.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 436886.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 728144,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 77097.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 231292.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 385488,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 119929.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 359788.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 599648,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 77097.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 231292.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 385488,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 34265.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 102796.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 171328,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 51398.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 154195.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 256992,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 34265.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 102796.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 171328,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 51398.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 154195.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 256992,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 34265.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 102796.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 171328,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 34265.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 102796.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 171328,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 51398.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 154195.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 256992,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 98513.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 295540.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 492568,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 73531.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 210593.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 347656,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K1G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 34265.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 102796.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 171328,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 42832,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 128496,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 214160,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 8566.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 25699.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 42832,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 8566.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 25699.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 42832,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 20559.36,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 61678.08,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 102796.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 37692.16,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 113076.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 188460.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 12849.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 38548.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K1G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 64248,
   "t": "Service"
  }
 ],
 "FortiGate 3500G": [
  {
   "sku": "FG-3500G",
   "d": "HW FG-3500G",
   "p": 302702,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 547746.8,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1037836.4,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1527926,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 504503.6,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 908106.8,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1311710,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 432431.6,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 691890.8,
   "t": "HW"
  },
  {
   "sku": "FG-3500G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 951350,
   "t": "HW"
  },
  {
   "sku": "FC-10-G3K5G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 245044.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 735134.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1225224,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 201801.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 605404.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1009008,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 129729.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 389188.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 648648,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 129729.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 389188.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 648648,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 57657.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 172972.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 288288,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 86486.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 259459.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 432432,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 57657.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 172972.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 288288,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 86486.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 259459.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 432432,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 57657.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 172972.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 288288,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 144144,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 432432,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 720720,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 100900.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 302702.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 504504,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 57657.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 172972.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 288288,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 86486.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 259459.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 432432,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 165765.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 497296.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 828828,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 120315.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 350945.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 581576,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G3K5G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 57657.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 172972.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 288288,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 72072,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 216216,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 360360,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 14414.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 43243.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 72072,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 14414.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 43243.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 72072,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 34594.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 103783.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 172972.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 63423.36,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 190270.08,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 317116.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 21621.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 64864.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G3K5G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 108108,
   "t": "Service"
  }
 ],
 "FortiGate 3501G": [
  {
   "sku": "FG-3501G",
   "d": "HW FG-3501G",
   "p": 317702,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 567745.65,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1067832.95,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1567920.25,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 523620.3,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 935456.9,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1347293.5,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 450078.05,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 714830.15,
   "t": "HW"
  },
  {
   "sku": "FG-3501G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 979582.25,
   "t": "HW"
  },
  {
   "sku": "FC-10-G35G1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 250043.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 750130.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1250218.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 205918.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 617754.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1029591.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 132376.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 397128.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 661880.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 132376.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 397128.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 661880.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 58833.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 176501.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 294169,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 88250.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 264752.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 441253.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 58833.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 176501.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 294169,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 88250.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 264752.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 441253.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 58833.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 176501.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 294169,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 147084.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 441253.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 735422.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 102959.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 308877.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 514795.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 58833.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 176501.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 294169,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 88250.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 264752.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 441253.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 169147.18,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 507441.53,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 845735.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 122667.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 358002.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 593338,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G35G1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 58833.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 176501.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 294169,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 73542.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 220626.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 367711.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 14708.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 44125.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 73542.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 14708.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 44125.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 73542.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 35300.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 105900.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 176501.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 64717.18,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 194151.54,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 323585.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 22062.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 66188.03,
   "t": "Service"
  },
  {
   "sku": "FC-10-G35G1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 110313.38,
   "t": "Service"
  }
 ],
 "FortiGate 3800G": [
  {
   "sku": "FG-3800G",
   "d": "HW FG-3800G",
   "p": 494471,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 842546,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1538696,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2234846,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 781121,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1354421,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1927721,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 678746,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 1047296,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 1415846,
   "t": "HW"
  },
  {
   "sku": "FC-10-3K80G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 348075,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1044225,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1740375,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 286650,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 859950,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1433250,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 184275,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 552825,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 921375,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 184275,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 552825,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 921375,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 122850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 368550,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 614250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 122850,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 368550,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 614250,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 204750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 614250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1023750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 143325,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 429975,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 716625,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 122850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 368550,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 614250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 235462.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 706387.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1177312.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 168800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 496400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 824000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K80G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 102375,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 307125,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 511875,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20475,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 61425,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 102375,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20475,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 61425,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 102375,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49140,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 147420,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 90090,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 270270,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 450450,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 30712.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 92137.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K80G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 153562.5,
   "t": "Service"
  },
  {
   "sku": "FG-3800G-DC",
   "d": "HW FG-3800G-DC",
   "p": 494471,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 842546,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1538696,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2234846,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 781121,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1354421,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1927721,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 678746,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 1047296,
   "t": "HW"
  },
  {
   "sku": "FG-3800G-DC-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 1415846,
   "t": "HW"
  },
  {
   "sku": "FC-10-D380G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 348075,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1044225,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1740375,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 184275,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 552825,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 921375,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 286650,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 859950,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1433250,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 184275,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 552825,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 921375,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 122850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 368550,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 614250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 122850,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 368550,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 614250,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 204750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 614250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1023750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 143325,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 429975,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 716625,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 122850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 368550,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 614250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 235462.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 706387.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1177312.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 168800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 496400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 824000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D380G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 81900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 409500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 102375,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 307125,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 511875,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20475,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 61425,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 102375,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20475,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 61425,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 102375,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49140,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 147420,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 245700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 90090,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 270270,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 450450,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 30712.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 92137.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D380G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 153562.5,
   "t": "Service"
  }
 ],
 "FortiGate 3801G": [
  {
   "sku": "FG-3801G",
   "d": "HW FG-3801G",
   "p": 509471,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 868104.7,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1585372.1,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2302639.5,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 804816.4,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1395507.2,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1986198,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 699335.9,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 1079065.7,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 1458795.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-3K81G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 358633.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1075901.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1793168.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 295345.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 886036.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1476727,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 189864.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 569594.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 949324.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 189864.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 569594.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 949324.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 126576.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 379729.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 632883,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 126576.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 379729.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 632883,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 210961,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 632883,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1054805,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 147672.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 443018.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 738363.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 126576.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 379729.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 632883,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 242605.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 727815.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1213025.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 173768.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 511306.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 848844,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-3K81G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 105480.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 316441.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 527402.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 21096.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 63288.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 105480.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 21096.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 63288.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 105480.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 50630.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 151891.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 92822.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 278468.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 464114.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 31644.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 94932.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-3K81G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 158220.75,
   "t": "Service"
  },
  {
   "sku": "FG-3801G-DC",
   "d": "HW FG-3801G-DC",
   "p": 509471,
   "t": "HW"
  },
  {
   "sku": "FC-10-D381G-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 210961,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 632883,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1054805,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 147672.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 443018.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 738363.5,
   "t": "SaaS"
  },
  {
   "sku": "FG-3801G-DC-BDL-1082-12",
   "d": "1 Year HW, Sovereign SASE Security",
   "p": 699335.9,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-1082-36",
   "d": "3 Year HW, Sovereign SASE Security",
   "p": 1079065.7,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-1082-60",
   "d": "5 Year HW, Sovereign SASE Security",
   "p": 1458795.5,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 868104.7,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1585372.1,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2302639.5,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 804816.4,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1395507.2,
   "t": "HW"
  },
  {
   "sku": "FG-3801G-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1986198,
   "t": "HW"
  },
  {
   "sku": "FC-10-D381G-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 358633.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1075901.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1793168.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-1082-02-12",
   "d": "1 Year Sovereign SASE Security",
   "p": 189864.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-1082-02-36",
   "d": "3 Year Sovereign SASE Security",
   "p": 569594.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-1082-02-60",
   "d": "5 Year Sovereign SASE Security",
   "p": 949324.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 295345.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 886036.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1476727,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 189864.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 569594.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 949324.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 126576.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 379729.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 632883,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 126576.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 379729.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 632883,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-159-02-12",
   "d": "1 Year IS SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-159-02-36",
   "d": "3 Year IS SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-159-02-60",
   "d": "5 Year IS SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 126576.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 379729.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 632883,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 242605.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 727815.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1213025.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 173768.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 511306.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 848844,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D381G-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 84384.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 421922,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 105480.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 316441.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 527402.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 21096.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 63288.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 105480.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 21096.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 63288.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 105480.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 50630.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 151891.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 253153.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 92822.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 278468.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 464114.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 31644.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 94932.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-D381G-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 158220.75,
   "t": "Service"
  }
 ],
 "FortiGate 40F": [
  {
   "sku": "FG-40F",
   "d": "HW FG-40F",
   "p": 873,
   "t": "HW"
  },
  {
   "sku": "FG-40F-HA",
   "d": "HA Pair HW",
   "p": 873,
   "t": "HW"
  },
  {
   "sku": "FG-40F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1383,
   "t": "HW"
  },
  {
   "sku": "FG-40F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2250,
   "t": "HW"
  },
  {
   "sku": "FG-40F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3040.5,
   "t": "HW"
  },
  {
   "sku": "FG-40F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1293,
   "t": "HW"
  },
  {
   "sku": "FG-40F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 2007,
   "t": "HW"
  },
  {
   "sku": "FG-40F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 2658,
   "t": "HW"
  },
  {
   "sku": "FC-10-0040F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 510,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1377,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2167.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 420,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1134,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1785,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 270,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 729,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1147.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 120,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 360,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 600,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 180,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 540,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 120,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 360,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 600,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 180,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 540,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 900,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 120,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 360,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 600,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 300,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 210,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 630,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1050,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 210,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 630,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1050,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 120,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 360,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 600,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 180,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 540,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 345,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1035,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1725,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1860,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2580,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3300,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0040F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 90,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 270,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 120,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 360,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 600,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 150,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 30,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 90,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 150,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 135,
   "t": "Service"
  },
  {
   "sku": "FC-10-0040F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 225,
   "t": "Service"
  },
  {
   "sku": "FG-40F-3G4G",
   "d": "HW FG-40F-3G4G",
   "p": 1464,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-HA",
   "d": "HA Pair HW",
   "p": 1464,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2446.6,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4117.02,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5640.05,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2273.2,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 3648.84,
   "t": "HW"
  },
  {
   "sku": "FG-40F-3G4G-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 4903.1,
   "t": "HW"
  },
  {
   "sku": "FC-10-F40FG-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 982.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2653.02,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 4176.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 809.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2184.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3439.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 520.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1404.54,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2210.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 231.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 693.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1156,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 346.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1040.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1734,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 231.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 693.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1156,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 346.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1040.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1734,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-159-02-12",
   "d": "1 Year IS SVC",
   "p": 231.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-159-02-36",
   "d": "3 Year IS SVC",
   "p": 693.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1156,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 578,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1734,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2890,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 404.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1213.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2023,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 404.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1213.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2023,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 231.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 693.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1156,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 346.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1040.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1734,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 664.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1994.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 3323.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2193.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3580.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 4968,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F40FG-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 57.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 173.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 520.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 867,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 231.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 693.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1156,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 289,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 867,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1445,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 57.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 173.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 289,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 86.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 260.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F40FG-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 433.5,
   "t": "Service"
  }
 ],
 "FortiGate 60F": [
  {
   "sku": "FG-60F",
   "d": "HW FG-60F",
   "p": 990,
   "t": "HW"
  },
  {
   "sku": "FG-60F-HA",
   "d": "HA Pair HW",
   "p": 990,
   "t": "HW"
  },
  {
   "sku": "FG-60F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1672.55,
   "t": "HW"
  },
  {
   "sku": "FG-60F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2832.89,
   "t": "HW"
  },
  {
   "sku": "FG-60F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3890.84,
   "t": "HW"
  },
  {
   "sku": "FG-60F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 1552.1,
   "t": "HW"
  },
  {
   "sku": "FG-60F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 2507.67,
   "t": "HW"
  },
  {
   "sku": "FG-60F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 3378.93,
   "t": "HW"
  },
  {
   "sku": "FC-10-0060F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 682.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1842.89,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2900.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 562.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1517.67,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2388.93,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 361.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 975.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1535.74,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 160.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 481.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 803,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 240.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 722.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1204.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 160.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 481.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 803,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 240.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 722.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1204.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 160.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 481.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 803,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 401.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1204.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2007.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 281.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 843.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1405.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 281.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 843.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1405.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 160.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 481.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 803,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 240.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 722.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1204.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 461.73,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1385.18,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 2308.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 1981.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 2945.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 3909,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0060F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 50,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 120.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 361.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 602.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 160.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 481.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 803,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 200.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 602.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1003.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 40.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 120.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 200.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 60.23,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 180.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-0060F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 301.13,
   "t": "Service"
  },
  {
   "sku": "FG-60F-LENC",
   "d": "HW FG-60F-LENC",
   "p": 1040,
   "t": "HW"
  }
 ],
 "FortiGate 61F": [
  {
   "sku": "FG-61F",
   "d": "HW FG-61F",
   "p": 1309,
   "t": "HW"
  },
  {
   "sku": "FG-61F-HA",
   "d": "HA Pair HW",
   "p": 1309,
   "t": "HW"
  },
  {
   "sku": "FG-61F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2187.9,
   "t": "HW"
  },
  {
   "sku": "FG-61F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3682.03,
   "t": "HW"
  },
  {
   "sku": "FG-61F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5044.33,
   "t": "HW"
  },
  {
   "sku": "FG-61F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2032.8,
   "t": "HW"
  },
  {
   "sku": "FG-61F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 3263.26,
   "t": "HW"
  },
  {
   "sku": "FG-61F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 4385.15,
   "t": "HW"
  },
  {
   "sku": "FC-10-0061F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 878.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2373.03,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 3735.33,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 723.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1954.26,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3076.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 465.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1256.31,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 1977.53,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 206.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 620.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1034,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 310.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 930.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1551,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 206.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 620.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1034,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 310.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 930.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1551,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 206.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 620.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1034,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-1337-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 517,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-1337-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1551,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-1337-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2585,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-1387-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 361.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-1387-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1085.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-1387-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1809.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 361.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1085.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 1809.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 206.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 620.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1034,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 310.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 930.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1551,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 594.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1783.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 2972.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2120.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3361.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 4602,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0061F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 51.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 155.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 465.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 775.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 206.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 620.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1034,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 258.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 775.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1292.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 51.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 155.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 258.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 77.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 232.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-0061F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 387.75,
   "t": "Service"
  },
  {
   "sku": "FG-61F-LENC",
   "d": "HW FG-61F-LENC",
   "p": 1375,
   "t": "HW"
  }
 ],
 "FortiGate 71F": [
  {
   "sku": "FG-71F",
   "d": "HW FG-71F",
   "p": 1348,
   "t": "HW"
  },
  {
   "sku": "FG-71F-HA",
   "d": "HA Pair HW",
   "p": 1348,
   "t": "HW"
  },
  {
   "sku": "FG-71F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2389.25,
   "t": "HW"
  },
  {
   "sku": "FG-71F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4159.38,
   "t": "HW"
  },
  {
   "sku": "FG-71F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5773.31,
   "t": "HW"
  },
  {
   "sku": "FG-71F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 2205.5,
   "t": "HW"
  },
  {
   "sku": "FG-71F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 3663.25,
   "t": "HW"
  },
  {
   "sku": "FG-71F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 4992.38,
   "t": "HW"
  },
  {
   "sku": "FC-10-0071F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1041.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 2811.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 4425.31,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 857.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 2315.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 3644.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 551.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 1488.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 2342.81,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 245,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 735,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1225,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 367.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1102.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 1837.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 245,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 735,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1225,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 367.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1102.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 1837.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 245,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 735,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1225,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 612.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1837.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3062.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 428.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1286.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2143.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 428.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1286.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2143.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 245,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 735,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1225,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 367.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1102.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 1837.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 704.38,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2113.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 3521.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2235,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 3705,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 5175,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0071F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 61.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 183.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 551.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 918.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 245,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 735,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1225,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 306.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 918.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 1531.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 61.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 183.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 306.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 91.88,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 275.63,
   "t": "Service"
  },
  {
   "sku": "FC-10-0071F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 459.38,
   "t": "Service"
  }
 ],
 "FortiGate 80F": [
  {
   "sku": "FG-80F",
   "d": "HW FG-80F",
   "p": 1852,
   "t": "HW"
  },
  {
   "sku": "FG-80F-HA",
   "d": "HA Pair HW",
   "p": 1852,
   "t": "HW"
  },
  {
   "sku": "FG-80F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3282.55,
   "t": "HW"
  },
  {
   "sku": "FG-80F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5714.49,
   "t": "HW"
  },
  {
   "sku": "FG-80F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 7931.84,
   "t": "HW"
  },
  {
   "sku": "FG-80F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3030.1,
   "t": "HW"
  },
  {
   "sku": "FG-80F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 5032.87,
   "t": "HW"
  },
  {
   "sku": "FG-80F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 6858.93,
   "t": "HW"
  },
  {
   "sku": "FC-10-0080F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1430.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3862.49,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 6079.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1178.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 3180.87,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 5006.93,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 757.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 2044.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 3218.74,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 504.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1514.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2524.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 504.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1514.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2524.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 841.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2524.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 4207.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 589.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1767.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2945.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 589.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1767.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2945.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 504.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1514.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2524.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 967.73,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2903.18,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 4838.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2509.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 4529.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 6549,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0080F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 84.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 252.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 757.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1262.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 420.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1262.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 2103.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 84.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 252.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 420.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 126.23,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 378.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-0080F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 631.13,
   "t": "Service"
  },
  {
   "sku": "FG-80F-DSL",
   "d": "HW FG-80F-DSL",
   "p": 1876,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-HA",
   "d": "HA Pair HW",
   "p": 1876,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3325.25,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 5788.98,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 8035.31,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3069.5,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 5098.45,
   "t": "HW"
  },
  {
   "sku": "FG-80F-DSL-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 6948.38,
   "t": "HW"
  },
  {
   "sku": "FC-10-F80FD-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1449.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 3912.98,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 6159.31,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1193.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 3222.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 5072.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 767.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 2071.58,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 3260.81,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 341,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1023,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1705,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 511.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1534.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2557.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 341,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1023,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1705,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 511.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1534.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2557.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-159-02-12",
   "d": "1 Year IS SVC",
   "p": 341,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1023,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1705,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 852.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2557.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 4262.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 596.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 1790.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 2983.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 596.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 1790.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 2983.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 341,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1023,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1705,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 511.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1534.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2557.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 980.38,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 2941.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 4901.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2523,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 4569,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 6615,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FD-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 85.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 255.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 767.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1278.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 341,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1023,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1705,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 426.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1278.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 2131.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 85.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 255.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 426.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 127.88,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 383.63,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FD-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 639.38,
   "t": "Service"
  },
  {
   "sku": "FG-80F-POE",
   "d": "HW FG-80F-POE",
   "p": 2159,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-HA",
   "d": "HA Pair HW",
   "p": 2159,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3826.7,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 6661.79,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 9246.73,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3532.4,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 5867.18,
   "t": "HW"
  },
  {
   "sku": "FG-80F-POE-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 7995.95,
   "t": "HW"
  },
  {
   "sku": "FC-10-F80FP-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1667.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 4502.79,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 7087.73,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1373.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 3708.18,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 5836.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 882.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 2383.83,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 3752.33,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 392.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1177.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 1962,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 588.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1765.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 2943,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 392.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1177.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 1962,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 588.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1765.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 2943,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-159-02-12",
   "d": "1 Year IS SVC",
   "p": 392.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1177.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-159-02-60",
   "d": "5 Year IS SVC",
   "p": 1962,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 981,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2943,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 4905,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 686.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2060.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3433.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 686.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 2060.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 3433.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 392.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1177.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 1962,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 588.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1765.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 2943,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 1128.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 3384.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 5640.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2677.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 5031.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 7386,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FP-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 98.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 294.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 882.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1471.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 392.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1177.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 1962,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 490.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1471.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 2452.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 98.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 294.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 490.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 147.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 441.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FP-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 735.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1704.51,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1403.71,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 902.39,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 401.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 601.59,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 401.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 601.59,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-159-02-12",
   "d": "1 Year IS SVC",
   "p": 401.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1002.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 701.86,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 701.86,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 401.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 601.59,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 1153.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2853.18,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F80FC-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 100.27,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 300.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 401.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 501.33,
   "t": "Service"
  },
  {
   "sku": "FC-10-F80FC-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 100.27,
   "t": "Service"
  },
  {
   "sku": "FG-80F-LENC",
   "d": "HW FG-80F-LENC",
   "p": 1945,
   "t": "HW"
  }
 ],
 "FortiGate 81F": [
  {
   "sku": "FG-81F",
   "d": "HW FG-81F",
   "p": 2393,
   "t": "HW"
  },
  {
   "sku": "FG-81F-HA",
   "d": "HA Pair HW",
   "p": 2393,
   "t": "HW"
  },
  {
   "sku": "FG-81F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4241.75,
   "t": "HW"
  },
  {
   "sku": "FG-81F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 7384.63,
   "t": "HW"
  },
  {
   "sku": "FG-81F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 10250.19,
   "t": "HW"
  },
  {
   "sku": "FG-81F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 3915.5,
   "t": "HW"
  },
  {
   "sku": "FG-81F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 6503.75,
   "t": "HW"
  },
  {
   "sku": "FG-81F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 8863.63,
   "t": "HW"
  },
  {
   "sku": "FC-10-0081F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1848.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 4991.63,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 7857.19,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1522.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 4110.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 6470.63,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 978.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 2642.63,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 4159.69,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 435,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1305,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 2175,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 652.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 1957.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 3262.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 435,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1305,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 2175,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 652.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 1957.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 3262.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 435,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1305,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 2175,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1087.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 3262.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 5437.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 761.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2283.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3806.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 761.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 2283.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 3806.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 435,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1305,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 2175,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 652.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 1957.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 3262.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 1250.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 3751.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 6253.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2805,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 5415,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 8025,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0081F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 108.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 326.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 978.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1631.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 435,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1305,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 2175,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 543.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1631.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 2718.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 108.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 326.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 543.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 478.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1435.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2392.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 163.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 489.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-0081F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 815.63,
   "t": "Service"
  },
  {
   "sku": "FG-81F-POE",
   "d": "HW FG-81F-POE",
   "p": 2469,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-HA",
   "d": "HA Pair HW",
   "p": 2469,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 4376.4,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 7618.98,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 10575.45,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 4039.8,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 6710.16,
   "t": "HW"
  },
  {
   "sku": "FG-81F-POE-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 9144.9,
   "t": "HW"
  },
  {
   "sku": "FC-10-F81FP-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 1907.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 5149.98,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 8106.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 1570.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 4241.16,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 6675.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 2726.46,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 4291.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 448.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 1346.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 2244,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 673.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 2019.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 3366,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 448.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 1346.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 2244,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 673.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 2019.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 3366,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-159-02-12",
   "d": "1 Year IS SVC",
   "p": 448.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-159-02-36",
   "d": "3 Year IS SVC",
   "p": 1346.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-159-02-60",
   "d": "5 Year IS SVC",
   "p": 2244,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 1122,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 3366,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 5610,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 785.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 2356.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 3927,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-595-02-12",
   "d": "1 Year FortiSASE Cloud Management SVC",
   "p": 785.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-595-02-36",
   "d": "3 Year FortiSASE Cloud Management SVC",
   "p": 2356.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-595-02-60",
   "d": "5 Year FortiSASE Cloud Management SVC",
   "p": 3927,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 448.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 1346.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 2244,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 673.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 2019.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 3366,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 1290.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 3870.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 6451.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 2846.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 5539.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 8232,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F81FP-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 112.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-314-02-12",
   "d": "1 Year FC Ess CTC",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-314-02-36",
   "d": "3 Year FC Ess CTC",
   "p": 1009.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-314-02-60",
   "d": "5 Year FC Ess CTC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 448.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 1346.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 2244,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 561,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 1683,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 2805,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 112.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 336.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 561,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 1250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 1050,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 1750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 493.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 1481.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 2468.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 168.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 504.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F81FP-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 841.5,
   "t": "Service"
  }
 ],
 "FortiGate 400F": [
  {
   "sku": "FG-400F",
   "d": "HW FG-400F",
   "p": 17570,
   "t": "HW"
  },
  {
   "sku": "FG-400F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 30499.35,
   "t": "HW"
  },
  {
   "sku": "FG-400F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 56358.05,
   "t": "HW"
  },
  {
   "sku": "FG-400F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 82216.75,
   "t": "HW"
  },
  {
   "sku": "FG-400F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 28217.7,
   "t": "HW"
  },
  {
   "sku": "FG-400F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 49513.1,
   "t": "HW"
  },
  {
   "sku": "FG-400F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 70808.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-0400F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 12929.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 38788.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 64646.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 10647.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 31943.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 53238.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 6844.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 20534.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 34224.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 4563.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 13689.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 22816.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 4563.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 13689.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 22816.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 7605.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 22816.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 38027.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 5323.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 15971.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 26619.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 4563.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 13689.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 22816.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 8746.33,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 26238.98,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 43731.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 8844.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 22534.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 36224.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0400F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 760.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 3802.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 11408.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 19013.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 760.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2281.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3802.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 760.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 2281.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 3802.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 1825.32,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 5475.96,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 3346.42,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 10039.26,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 16732.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 1140.83,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 3422.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-0400F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 5704.13,
   "t": "Service"
  },
  {
   "sku": "FG-400F-DC",
   "d": "HW FG-400F-DC",
   "p": 17570,
   "t": "HW"
  },
  {
   "sku": "FG-400F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 30499.35,
   "t": "HW"
  },
  {
   "sku": "FG-400F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 56358.05,
   "t": "HW"
  },
  {
   "sku": "FG-400F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 82216.75,
   "t": "HW"
  },
  {
   "sku": "FG-400F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 28217.7,
   "t": "HW"
  },
  {
   "sku": "FG-400F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 49513.1,
   "t": "HW"
  },
  {
   "sku": "FG-400F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 70808.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD4H0-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 12929.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 38788.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 64646.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 10647.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 31943.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 53238.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 6844.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 20534.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 34224.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 4563.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 13689.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 22816.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 4563.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 13689.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 22816.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-159-02-12",
   "d": "1 Year IS SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-159-02-36",
   "d": "3 Year IS SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-159-02-60",
   "d": "5 Year IS SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 7605.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 22816.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 38027.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 5323.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 15971.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 26619.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 4563.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 13689.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 22816.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 8746.33,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 26238.98,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 43731.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 8844.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 22534.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 36224.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H0-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 760.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 3042.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 15211,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 3802.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 11408.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 19013.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 760.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2281.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3802.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 760.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 2281.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 3802.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 1825.32,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 5475.96,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 9126.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 3346.42,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 10039.26,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 16732.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 1140.83,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 3422.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H0-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 5704.13,
   "t": "Service"
  },
  {
   "sku": "FG-400F-LENC",
   "d": "HW FG-400F-LENC",
   "p": 18449,
   "t": "HW"
  }
 ],
 "FortiGate 401F": [
  {
   "sku": "FG-401F",
   "d": "HW FG-401F",
   "p": 21716,
   "t": "HW"
  },
  {
   "sku": "FG-401F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 36698.1,
   "t": "HW"
  },
  {
   "sku": "FG-401F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 66662.3,
   "t": "HW"
  },
  {
   "sku": "FG-401F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 96626.5,
   "t": "HW"
  },
  {
   "sku": "FG-401F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 34054.2,
   "t": "HW"
  },
  {
   "sku": "FG-401F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 58730.6,
   "t": "HW"
  },
  {
   "sku": "FG-401F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 83407,
   "t": "HW"
  },
  {
   "sku": "FC-10-0401F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 14982.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 44946.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 74910.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 12338.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 37014.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 61691,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 7931.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 23795.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 39658.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 5287.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 15863.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 26439,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 5287.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 15863.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 26439,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 8813,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 26439,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 44065,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 6169.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 18507.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 30845.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 5287.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 15863.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 26439,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 10134.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 30404.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 50674.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 9931.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 25795.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 41658.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-0401F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 881.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 4406.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 13219.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 22032.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 881.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2643.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 4406.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 881.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 2643.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 4406.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 2115.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 6345.36,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 3877.72,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 11633.16,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 19388.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 1321.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 3965.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-0401F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 6609.75,
   "t": "Service"
  },
  {
   "sku": "FG-401F-DC",
   "d": "HW FG-401F-DC",
   "p": 21716,
   "t": "HW"
  },
  {
   "sku": "FG-401F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 36698.1,
   "t": "HW"
  },
  {
   "sku": "FG-401F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 66662.3,
   "t": "HW"
  },
  {
   "sku": "FG-401F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 96626.5,
   "t": "HW"
  },
  {
   "sku": "FG-401F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 34054.2,
   "t": "HW"
  },
  {
   "sku": "FG-401F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 58730.6,
   "t": "HW"
  },
  {
   "sku": "FG-401F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 83407,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD4H1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 14982.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 44946.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 74910.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 12338.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 37014.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 61691,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 7931.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 23795.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 39658.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 5287.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 15863.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 26439,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 5287.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 15863.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 26439,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 8813,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 26439,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 44065,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 6169.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 18507.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 30845.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 5287.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 15863.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 26439,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 10134.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 30404.85,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 50674.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 9931.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 25795.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 41658.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD4H1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 881.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 3525.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 17626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 4406.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 13219.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 22032.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 881.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2643.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 4406.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 881.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 2643.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 4406.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 2115.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 6345.36,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 10575.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 3877.72,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 11633.16,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 19388.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 1321.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 3965.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD4H1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 6609.75,
   "t": "Service"
  }
 ],
 "FortiGate 1000F": [
  {
   "sku": "FG-1000F",
   "d": "HW FG-1000F",
   "p": 61318,
   "t": "HW"
  },
  {
   "sku": "FG-1000F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 106443.65,
   "t": "HW"
  },
  {
   "sku": "FG-1000F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 196694.95,
   "t": "HW"
  },
  {
   "sku": "FG-1000F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 286946.25,
   "t": "HW"
  },
  {
   "sku": "FG-1000F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 98480.3,
   "t": "HW"
  },
  {
   "sku": "FG-1000F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 172804.9,
   "t": "HW"
  },
  {
   "sku": "FG-1000F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 247129.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F1K0F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 45125.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 135376.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 225628.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 37162.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 111486.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 185811.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 23890.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 71670.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 119450.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 10617.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 31853.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 53089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 15926.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 47780.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 79633.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 10617.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 31853.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 53089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 15926.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 47780.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 79633.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 10617.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 31853.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 53089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 26544.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 79633.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 132722.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 18581.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 55743.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 92905.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 10617.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 31853.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 53089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 15926.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 47780.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 79633.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 30526.18,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 91578.53,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 152630.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 26235.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 68706.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 111178,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K0F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 2654.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 10617.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 31853.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 53089,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 13272.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 39816.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 66361.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2654.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 7963.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13272.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 2654.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 7963.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 13272.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 6370.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 19112.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 31853.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 11679.58,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 35038.74,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 58397.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 3981.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 11945.03,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K0F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 19908.38,
   "t": "Service"
  },
  {
   "sku": "FG-1000F-LENC",
   "d": "HW FG-1000F-LENC",
   "p": 64385,
   "t": "HW"
  }
 ],
 "FortiGate 1001F": [
  {
   "sku": "FG-1001F",
   "d": "HW FG-1001F",
   "p": 65476,
   "t": "HW"
  },
  {
   "sku": "FG-1001F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 113661.65,
   "t": "HW"
  },
  {
   "sku": "FG-1001F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 210032.95,
   "t": "HW"
  },
  {
   "sku": "FG-1001F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 306404.25,
   "t": "HW"
  },
  {
   "sku": "FG-1001F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 105158.3,
   "t": "HW"
  },
  {
   "sku": "FG-1001F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 184522.9,
   "t": "HW"
  },
  {
   "sku": "FG-1001F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 263887.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F1K1F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 48185.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 144556.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 240928.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 39682.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 119046.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 198411.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 25510.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 76530.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 127550.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 11337.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 34013.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 56689,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 17006.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 51020.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 85033.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 11337.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 34013.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 56689,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 17006.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 51020.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 85033.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 11337.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 34013.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 56689,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 28344.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 85033.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 141722.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 19841.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 59523.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 99205.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 11337.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 34013.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 56689,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 17006.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 51020.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 85033.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 32596.18,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 97788.53,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 162980.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 27675.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 73026.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 118378,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F1K1F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 2834.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 11337.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 34013.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 56689,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 14172.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 42516.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 70861.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2834.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 8503.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 14172.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 2834.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 8503.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 14172.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 6802.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 20408.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 34013.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 12471.58,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 37414.74,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 62357.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 4251.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 12755.03,
   "t": "Service"
  },
  {
   "sku": "FC-10-F1K1F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 21258.38,
   "t": "Service"
  }
 ],
 "FortiGate 1800F": [
  {
   "sku": "FG-1800F",
   "d": "HW FG-1800F",
   "p": 65843,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 112952.55,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 207171.65,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 301390.75,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 104639.1,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 182231.3,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 259823.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F18HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 47109.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 141328.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 235547.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 38796.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 116388.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 193980.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 24940.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 74821.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 124701.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 16626.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 49880.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 83134.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 16626.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 49880.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 83134.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 27711.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 83134.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 138557.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 19398.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 58194.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 96990.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 16626.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 49880.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 83134.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 31868.23,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 95604.68,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 159341.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 27169.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 71507.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 115846,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 2771.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 13855.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 41567.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 69278.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2771.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 8313.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13855.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 2771.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 8313.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 13855.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 6650.76,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 19952.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 12193.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 36579.18,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 60965.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 4156.73,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 12470.18,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 20783.63,
   "t": "Service"
  },
  {
   "sku": "FG-1800F-DC",
   "d": "HW FG-1800F-DC",
   "p": 65843,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 112952.55,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 207171.65,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 301390.75,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 104639.1,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 182231.3,
   "t": "HW"
  },
  {
   "sku": "FG-1800F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 259823.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-D18HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 47109.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 141328.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 235547.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 38796.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 116388.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 193980.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 24940.35,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 74821.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 124701.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 16626.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 49880.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 83134.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 16626.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 49880.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 83134.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 27711.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 83134.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 138557.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 19398.05,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 58194.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 96990.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 16626.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 49880.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 83134.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 31868.23,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 95604.68,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 159341.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 27169.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 71507.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 115846,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 2771.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 11084.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 55423,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 13855.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 41567.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 69278.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 2771.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 8313.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13855.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 2771.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 8313.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 13855.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 6650.76,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 19952.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 33253.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 12193.06,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 36579.18,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 60965.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 4156.73,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 12470.18,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 20783.63,
   "t": "Service"
  },
  {
   "sku": "FG-1800F-LENC",
   "d": "HW FG-1800F-LENC",
   "p": 69136,
   "t": "HW"
  }
 ],
 "FortiGate 1801F": [
  {
   "sku": "FG-1801F",
   "d": "HW FG-1801F",
   "p": 71331,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 122366.7,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 224438.1,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 326509.5,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 113360.4,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 197419.2,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 281478,
   "t": "HW"
  },
  {
   "sku": "FC-10-F18F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 51035.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 153107.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 255178.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 42029.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 126088.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 210147,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 27018.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 81056.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 135094.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 18012.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 54037.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 90063,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 18012.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 54037.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 90063,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 30021,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 90063,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 150105,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 21014.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 63044.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 105073.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 18012.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 54037.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 90063,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 34524.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 103572.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 172620.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 29016.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 77050.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 125084,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F18F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 3002.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 15010.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 45031.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 75052.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3002.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 9006.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 15010.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 3002.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 9006.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 15010.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 7205.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 21615.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 13209.24,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 39627.72,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 66046.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 4503.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 13509.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F18F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 22515.75,
   "t": "Service"
  },
  {
   "sku": "FG-1801F-DC",
   "d": "HW FG-1801F-DC",
   "p": 71331,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 122366.7,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 224438.1,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 326509.5,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 113360.4,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 197419.2,
   "t": "HW"
  },
  {
   "sku": "FG-1801F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 281478,
   "t": "HW"
  },
  {
   "sku": "FC-10-D18F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 51035.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 153107.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 255178.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 42029.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 126088.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 210147,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 27018.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 81056.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 135094.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 18012.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 54037.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 90063,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 18012.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 54037.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 90063,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 30021,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 90063,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 150105,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 21014.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 63044.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 105073.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 18012.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 54037.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 90063,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 34524.15,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 103572.45,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 172620.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 29016.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 77050.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 125084,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D18F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 3002.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 12008.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 60042,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 15010.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 45031.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 75052.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3002.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 9006.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 15010.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 3002.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 9006.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 15010.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 7205.04,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 21615.12,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 36025.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 13209.24,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 39627.72,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 66046.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 4503.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 13509.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-D18F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 22515.75,
   "t": "Service"
  },
  {
   "sku": "FG-1801F-LENC",
   "d": "HW FG-1801F-LENC",
   "p": 74898,
   "t": "HW"
  }
 ],
 "FortiGate 2600F": [
  {
   "sku": "FG-2600F",
   "d": "HW FG-2600F",
   "p": 86420,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 150018.7,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 277216.1,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 404413.5,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 138795.4,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 243546.2,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 348297,
   "t": "HW"
  },
  {
   "sku": "FC-10-F26HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 63598.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 190796.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 317993.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 52375.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 157126.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 261877,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 33669.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 101009.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 168349.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 22446.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 67339.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 112233,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 22446.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 67339.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 112233,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 37411,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 112233,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 187055,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 26187.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 78563.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 130938.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 22446.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 67339.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 112233,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 43022.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 129067.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 215113.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 34928.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 94786.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 154644,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 3741.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 18705.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 56116.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 93527.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3741.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 11223.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 18705.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 3741.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 11223.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 18705.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 8978.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 26935.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 16460.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 49382.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 82304.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 5611.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 16834.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 28058.25,
   "t": "Service"
  },
  {
   "sku": "FG-2600F-DC",
   "d": "HW FG-2600F-DC",
   "p": 86420,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 150018.7,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 277216.1,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 404413.5,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 138795.4,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 243546.2,
   "t": "HW"
  },
  {
   "sku": "FG-2600F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 348297,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD26F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 63598.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 190796.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 317993.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 52375.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 157126.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 261877,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 33669.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 101009.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 168349.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 22446.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 67339.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 112233,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 22446.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 67339.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 112233,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 37411,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 112233,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 187055,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 26187.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 78563.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 130938.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 22446.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 67339.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 112233,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 43022.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 129067.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 215113.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 34928.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 94786.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 154644,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD26F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 3741.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 14964.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 74822,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 18705.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 56116.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 93527.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3741.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 11223.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 18705.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 3741.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 11223.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 18705.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 8978.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 26935.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 44893.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 16460.84,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 49382.52,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 82304.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 5611.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 16834.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD26F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 28058.25,
   "t": "Service"
  }
 ],
 "FortiGate 2601F": [
  {
   "sku": "FG-2601F",
   "d": "HW FG-2601F",
   "p": 93827,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 160959.15,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 295223.45,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 429487.75,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 149112.3,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 259682.9,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 370253.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F26F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 67132.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 201396.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 335660.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 55285.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 165855.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 276426.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 35540.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 106621.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 177702.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 23693.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 71081.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 118468.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 23693.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 71081.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 118468.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 39489.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 118468.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 197447.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 27642.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 82927.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 138213.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 23693.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 71081.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 118468.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 45412.93,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 136238.78,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 227064.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 36591.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 99774.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 162958,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F26F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 3948.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 19744.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 59234.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 98723.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3948.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 11846.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 19744.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 3948.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 11846.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 19744.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 9477.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 28432.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 17375.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 52126.14,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 86876.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 5923.43,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 17770.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-F26F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 29617.13,
   "t": "Service"
  },
  {
   "sku": "FG-2601F-DC",
   "d": "HW FG-2601F-DC",
   "p": 93827,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 160959.15,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 295223.45,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 429487.75,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 149112.3,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 259682.9,
   "t": "HW"
  },
  {
   "sku": "FG-2601F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 370253.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD261-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 67132.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 201396.45,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 335660.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 55285.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 165855.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 276426.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 35540.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 106621.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 177702.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 23693.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 71081.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 118468.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 23693.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 71081.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 118468.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-159-02-12",
   "d": "1 Year IS SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-159-02-36",
   "d": "3 Year IS SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-159-02-60",
   "d": "5 Year IS SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 39489.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 118468.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 197447.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 27642.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 82927.95,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 138213.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 23693.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 71081.1,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 118468.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 45412.93,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 136238.78,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 227064.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 36591.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 99774.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 162958,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD261-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 3948.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 15795.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 78979,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 19744.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 59234.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 98723.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 3948.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 11846.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 19744.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 3948.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 11846.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 19744.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 9477.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 28432.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 47387.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 17375.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 52126.14,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 86876.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 5923.43,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 17770.28,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD261-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 29617.13,
   "t": "Service"
  },
  {
   "sku": "FG-2601F-LENC",
   "d": "HW FG-2601F-LENC",
   "p": 98519,
   "t": "HW"
  }
 ],
 "FortiGate 3000F": [
  {
   "sku": "FG-3000F",
   "d": "HW FG-3000F",
   "p": 129596,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 224969.4,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 415716.2,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 606463,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 208138.8,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 365224.4,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 522310,
   "t": "HW"
  },
  {
   "sku": "FC-10-F3K0F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 95373.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 286120.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 476867,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 78542.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 235628.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 392714,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 50491.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 151475.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 252459,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 33661.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 100983.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 168306,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 33661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 100983.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 168306,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 56102,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 168306,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 280510,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 39271.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 117814.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 196357,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 33661.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 100983.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 168306,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 64517.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 193551.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 322586.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 49881.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 139644.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 229408,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K0F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 28051,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 84153,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 140255,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5610.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 16830.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 28051,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 5610.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 16830.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 28051,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 13464.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 40393.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 24684.88,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 74054.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 123424.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 8415.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 25245.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K0F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 42076.5,
   "t": "Service"
  },
  {
   "sku": "FG-3000F-DC",
   "d": "HW FG-3000F-DC",
   "p": 129596,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 224969.4,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 415716.2,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 606463,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 208138.8,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 365224.4,
   "t": "HW"
  },
  {
   "sku": "FG-3000F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 522310,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD3K0-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 95373.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 286120.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 476867,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 78542.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 235628.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 392714,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 50491.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 151475.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 252459,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 33661.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 100983.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 168306,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 33661.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 100983.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 168306,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-159-02-12",
   "d": "1 Year IS SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-159-02-36",
   "d": "3 Year IS SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-159-02-60",
   "d": "5 Year IS SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 56102,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 168306,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 280510,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 39271.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 117814.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 196357,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 33661.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 100983.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 168306,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 64517.3,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 193551.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 322586.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 49881.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 139644.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 229408,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K0-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 22440.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 112204,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 28051,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 84153,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 140255,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5610.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 16830.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 28051,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 5610.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 16830.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 28051,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 13464.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 40393.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 67322.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 24684.88,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 74054.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 123424.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 8415.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 25245.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K0-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 42076.5,
   "t": "Service"
  }
 ],
 "FortiGate 3001F": [
  {
   "sku": "FG-3001F",
   "d": "HW FG-3001F",
   "p": 136873,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 237601.4,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 439058.2,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 640515,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 219825.8,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 385731.4,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 551637,
   "t": "HW"
  },
  {
   "sku": "FC-10-F3K1F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 100728.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 302185.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 503642,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 82952.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 248858.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 414764,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 53326.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 159980.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 266634,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 35551.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 106653.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 177756,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 35551.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 106653.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 177756,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 59252,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 177756,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 296260,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 41476.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 124429.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 207382,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 35551.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 106653.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 177756,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 68139.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 204419.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 340699,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 52401.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 147204.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 242008,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K1F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 29626,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 88878,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 148130,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5925.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17775.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 29626,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 5925.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 17775.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 29626,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 14220.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 42661.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 26070.88,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 78212.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 130354.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 8887.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 26663.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K1F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 44439,
   "t": "Service"
  },
  {
   "sku": "FG-3001F-DC",
   "d": "HW FG-3001F-DC",
   "p": 136873,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 237601.4,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 439058.2,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 640515,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 219825.8,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 385731.4,
   "t": "HW"
  },
  {
   "sku": "FG-3001F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 551637,
   "t": "HW"
  },
  {
   "sku": "FC-10-FD3K1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 100728.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 302185.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 503642,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 82952.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 248858.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 414764,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 53326.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 159980.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 266634,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 35551.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 106653.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 177756,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 35551.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 106653.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 177756,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 59252,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 177756,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 296260,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 41476.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 124429.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 207382,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 35551.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 106653.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 177756,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 68139.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 204419.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 340699,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 52401.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 147204.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 242008,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-FD3K1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 23700.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 118504,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 29626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 88878,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 148130,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 5925.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17775.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 29626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 5925.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 17775.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 29626,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 14220.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 42661.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 71102.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 26070.88,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 78212.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 130354.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 8887.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 26663.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-FD3K1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 44439,
   "t": "Service"
  },
  {
   "sku": "FG-3001F-LENC",
   "d": "HW FG-3001F-LENC",
   "p": 143717,
   "t": "HW"
  }
 ],
 "FortiGate 3200F": [
  {
   "sku": "FG-3200F",
   "d": "HW FG-3200F",
   "p": 173250,
   "t": "HW"
  },
  {
   "sku": "FG-3200F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 300750,
   "t": "HW"
  },
  {
   "sku": "FG-3200F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 555750,
   "t": "HW"
  },
  {
   "sku": "FG-3200F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 810750,
   "t": "HW"
  },
  {
   "sku": "FG-3200F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 278250,
   "t": "HW"
  },
  {
   "sku": "FG-3200F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 488250,
   "t": "HW"
  },
  {
   "sku": "FG-3200F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 698250,
   "t": "HW"
  },
  {
   "sku": "FC-10-F3K2F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 127500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 382500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 637500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 105000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 315000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 525000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 67500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 202500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 337500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 30000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 90000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 150000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 45000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 135000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 225000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 30000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 90000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 150000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 45000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 135000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 225000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 30000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 90000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 150000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 75000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 225000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 375000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 52500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 157500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 262500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 30000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 90000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 150000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 45000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 135000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 225000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 86250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 258750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 431250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 65000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 185000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 305000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K2F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 30000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 90000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 150000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-284-02-12",
   "d": "1 Year ASE FC SVC",
   "p": 37500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-284-02-36",
   "d": "3 Year ASE FC SVC",
   "p": 112500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-284-02-60",
   "d": "5 Year ASE FC SVC",
   "p": 187500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 7500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 22500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 37500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 7500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 22500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 37500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 18000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 54000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 90000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 33000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 99000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 165000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 11250,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 33750,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K2F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 56250,
   "t": "Service"
  }
 ],
 "FortiGate 3201F": [
  {
   "sku": "FG-3201F",
   "d": "HW FG-3201F",
   "p": 180180,
   "t": "HW"
  },
  {
   "sku": "FG-3201F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 312780,
   "t": "HW"
  },
  {
   "sku": "FG-3201F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 577980,
   "t": "HW"
  },
  {
   "sku": "FG-3201F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 843180,
   "t": "HW"
  },
  {
   "sku": "FG-3201F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 289380,
   "t": "HW"
  },
  {
   "sku": "FG-3201F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 507780,
   "t": "HW"
  },
  {
   "sku": "FG-3201F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 726180,
   "t": "HW"
  },
  {
   "sku": "FC-10-F32F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 132600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 397800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 663000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 109200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 327600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 546000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 70200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 210600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 351000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 31200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 93600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 156000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 46800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 140400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 234000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 31200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 93600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 156000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 46800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 140400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 234000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 31200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 93600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 156000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 78000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 234000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 390000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 54600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 163800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 273000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 31200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 93600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 156000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 46800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 140400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 234000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 89700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 269100,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 448500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 67400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 192200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 317000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F32F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 31200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 93600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 156000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 39000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 117000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 195000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 7800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 23400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 39000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 7800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 23400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 39000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 18720,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 56160,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 93600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 34320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 102960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 171600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 11700,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 35100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F32F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 58500,
   "t": "Service"
  }
 ],
 "FortiGate 3500F": [
  {
   "sku": "FG-3500F",
   "d": "HW FG-3500F",
   "p": 284130,
   "t": "HW"
  },
  {
   "sku": "FG-3500F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 493230,
   "t": "HW"
  },
  {
   "sku": "FG-3500F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 911430,
   "t": "HW"
  },
  {
   "sku": "FG-3500F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1329630,
   "t": "HW"
  },
  {
   "sku": "FG-3500F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 456330,
   "t": "HW"
  },
  {
   "sku": "FG-3500F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 800730,
   "t": "HW"
  },
  {
   "sku": "FG-3500F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1145130,
   "t": "HW"
  },
  {
   "sku": "FC-10-F3K5F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 209100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 627300,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1045500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 172200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 516600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 861000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 110700,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 332100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 553500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 49200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 147600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 246000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 73800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 221400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 369000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 49200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 147600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 246000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 73800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 221400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 369000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 49200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 147600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 246000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 86100,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 258300,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 430500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 49200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 147600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 246000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 73800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 221400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 369000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 141450,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 424350,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 707250,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 103400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 300200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 497000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K5F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 49200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 147600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 246000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 61500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 184500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 307500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 12300,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 36900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 61500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 12300,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 36900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 61500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 29520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 88560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 147600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 54120,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 162360,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 270600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 18450,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 55350,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K5F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 92250,
   "t": "Service"
  },
  {
   "sku": "FG-3500F-LENC",
   "d": "HW FG-3500F-LENC",
   "p": 298337,
   "t": "HW"
  }
 ],
 "FortiGate 3501F": [
  {
   "sku": "FC1-10-S35F1-1161-02-12",
   "d": "1 Year FGaaS Enterprise",
   "p": 253859.38,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1161-02-36",
   "d": "3 Year FGaaS Enterprise",
   "p": 761578.14,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1161-02-60",
   "d": "5 Year FGaaS Enterprise",
   "p": 1269296.9,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1162-02-12",
   "d": "1 Year FGaaS UTP",
   "p": 222359.38,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1162-02-36",
   "d": "3 Year FGaaS UTP",
   "p": 667078.14,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1162-02-60",
   "d": "5 Year FGaaS UTP",
   "p": 1111796.9,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1160-02-12",
   "d": "1 Year FGaaS FC with Bandwidth IP 2",
   "p": 117359.38,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1160-02-36",
   "d": "3 Year FGaaS FC with Bandwidth IP 2",
   "p": 352078.14,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1160-02-60",
   "d": "5 Year FGaaS FC with Bandwidth IP 2",
   "p": 586796.9,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1164-02-12",
   "d": "1 Year FGaaS Enterprise IP 3",
   "p": 505968.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1164-02-36",
   "d": "3 Year FGaaS Enterprise IP 3",
   "p": 1517906.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1164-02-60",
   "d": "5 Year FGaaS Enterprise IP 3",
   "p": 2529843.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1165-02-12",
   "d": "1 Year FGaaS UTP IP 3",
   "p": 442968.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1165-02-36",
   "d": "3 Year FGaaS UTP IP 3",
   "p": 1328906.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1165-02-60",
   "d": "5 Year FGaaS UTP IP 3",
   "p": 2214843.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1163-02-12",
   "d": "1 Year FGaaS FC with Bandwidth IP 3",
   "p": 232968.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1163-02-36",
   "d": "3 Year FGaaS FC with Bandwidth IP 3",
   "p": 698906.25,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1163-02-60",
   "d": "5 Year FGaaS FC with Bandwidth IP 3",
   "p": 1164843.75,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1182-02-12",
   "d": "1 Year FortiCare Premium Upgrade for FGAAS",
   "p": 10500,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1182-02-36",
   "d": "3 Year FortiCare Premium Upgrade for FGAAS",
   "p": 31500,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1182-02-60",
   "d": "5 Year FortiCare Premium Upgrade for FGAAS",
   "p": 52500,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1185-02-12",
   "d": "1 Year FortiCare Premium Upgrade for FGAAS",
   "p": 21000,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1185-02-36",
   "d": "3 Year FortiCare Premium Upgrade for FGAAS",
   "p": 63000,
   "t": "Service"
  },
  {
   "sku": "FC1-10-S35F1-1185-02-60",
   "d": "5 Year FortiCare Premium Upgrade for FGAAS",
   "p": 105000,
   "t": "Service"
  },
  {
   "sku": "FG-3501F",
   "d": "HW FG-3501F",
   "p": 291060,
   "t": "HW"
  },
  {
   "sku": "FG-3501F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 505260,
   "t": "HW"
  },
  {
   "sku": "FG-3501F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 933660,
   "t": "HW"
  },
  {
   "sku": "FG-3501F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1362060,
   "t": "HW"
  },
  {
   "sku": "FG-3501F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 467460,
   "t": "HW"
  },
  {
   "sku": "FG-3501F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 820260,
   "t": "HW"
  },
  {
   "sku": "FG-3501F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1173060,
   "t": "HW"
  },
  {
   "sku": "FC-10-F35F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 214200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 642600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1071000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 176400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 529200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 882000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 113400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 340200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 567000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 50400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 151200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 252000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 75600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 226800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 378000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 50400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 151200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 252000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 75600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 226800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 378000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 50400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 151200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 252000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 126000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 378000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 630000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 88200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 264600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 441000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 50400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 151200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 252000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 75600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 226800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 378000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 144900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 434700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 724500,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 105800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 307400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 509000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F35F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 50400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 151200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 252000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 63000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 189000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 315000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 12600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 63000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 12600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 37800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 63000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 30240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 90720,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 151200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 55440,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 166320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 277200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 18900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 56700,
   "t": "Service"
  },
  {
   "sku": "FC-10-F35F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 94500,
   "t": "Service"
  }
 ],
 "FortiGate 3700F": [
  {
   "sku": "FG-3700F",
   "d": "HW FG-3700F",
   "p": 303534,
   "t": "HW"
  },
  {
   "sku": "FG-3700F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 538083,
   "t": "HW"
  },
  {
   "sku": "FG-3700F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1007181,
   "t": "HW"
  },
  {
   "sku": "FG-3700F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1476279,
   "t": "HW"
  },
  {
   "sku": "FG-3700F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 496692,
   "t": "HW"
  },
  {
   "sku": "FG-3700F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 883008,
   "t": "HW"
  },
  {
   "sku": "FG-3700F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1269324,
   "t": "HW"
  },
  {
   "sku": "FC-10-F3K7F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 234549,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 703647,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1172745,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 193158,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 579474,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 965790,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 124173,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 372519,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 620865,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 55188,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 165564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 275940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 82782,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 248346,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 413910,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 55188,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 165564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 275940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 82782,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 248346,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 413910,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 55188,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 165564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 275940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 137970,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 413910,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 689850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 96579,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 289737,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 482895,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 55188,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 165564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 275940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 82782,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 248346,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 413910,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 158665.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 475996.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 793327.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 115376,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 336128,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 556880,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F3K7F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 55188,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 165564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 275940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 68985,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 206955,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 344925,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13797,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 41391,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 68985,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 13797,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 41391,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 68985,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 33112.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 99338.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 165564,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 60706.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 182120.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 303534,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 20695.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 62086.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F3K7F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 103477.5,
   "t": "Service"
  }
 ],
 "FortiGate 3701F": [
  {
   "sku": "FG-3701F",
   "d": "HW FG-3701F",
   "p": 310464,
   "t": "HW"
  },
  {
   "sku": "FG-3701F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 550368,
   "t": "HW"
  },
  {
   "sku": "FG-3701F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1030176,
   "t": "HW"
  },
  {
   "sku": "FG-3701F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1509984,
   "t": "HW"
  },
  {
   "sku": "FG-3701F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 508032,
   "t": "HW"
  },
  {
   "sku": "FG-3701F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 903168,
   "t": "HW"
  },
  {
   "sku": "FG-3701F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1298304,
   "t": "HW"
  },
  {
   "sku": "FC-10-F37F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 239904,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 719712,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1199520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 197568,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 592704,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 987840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 127008,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 381024,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 635040,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 56448,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 169344,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 282240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 84672,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 254016,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 423360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 56448,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 169344,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 282240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 84672,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 254016,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 423360,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 56448,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 169344,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 282240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 141120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 423360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 705600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 98784,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 296352,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 493920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 56448,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 169344,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 282240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 84672,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 254016,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 423360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 162288,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 486864,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 811440,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 117896,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 343688,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 569480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F37F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 56448,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 169344,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 282240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 70560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 211680,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 352800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 14112,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 42336,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 70560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 14112,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 42336,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 70560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 33868.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 101606.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 169344,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 62092.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 186278.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 310464,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 21168,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 63504,
   "t": "Service"
  },
  {
   "sku": "FC-10-F37F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 105840,
   "t": "Service"
  }
 ],
 "FortiGate 4200F": [
  {
   "sku": "FG-4200F",
   "d": "HW FG-4200F",
   "p": 321568,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 543428.2,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 987148.6,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1430869,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 504276.4,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 869693.2,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1235110,
   "t": "HW"
  },
  {
   "sku": "FC-10-F42HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 221860.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 665580.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1109301,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 182708.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 548125.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 913542,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 117455.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 352366.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 587277,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 78303.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 234910.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 391518,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 78303.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 234910.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 391518,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 130506,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 391518,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 652530,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 91354.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 274062.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 456771,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 78303.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 234910.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 391518,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 150081.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 450245.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 750409.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 109404.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 318214.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 527024,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F42HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 65253,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 195759,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 326265,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13050.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 39151.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 65253,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 13050.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 39151.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 65253,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 31321.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 93964.32,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 57422.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 172267.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 287113.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 19575.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 58727.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F42HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 97879.5,
   "t": "Service"
  },
  {
   "sku": "FG-4200F-DC",
   "d": "HW FG-4200F-DC",
   "p": 321568,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 543428.2,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 987148.6,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1430869,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 504276.4,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 869693.2,
   "t": "HW"
  },
  {
   "sku": "FG-4200F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1235110,
   "t": "HW"
  },
  {
   "sku": "FC-10-D42HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 221860.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 665580.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1109301,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 182708.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 548125.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 913542,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 117455.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 352366.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 587277,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 78303.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 234910.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 391518,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 78303.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 234910.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 391518,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 130506,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 391518,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 652530,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 91354.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 274062.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 456771,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 78303.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 234910.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 391518,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 150081.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 450245.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 750409.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 109404.8,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 318214.4,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 527024,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D42HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 52202.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 261012,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 65253,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 195759,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 326265,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13050.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 39151.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 65253,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 13050.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 39151.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 65253,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 31321.44,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 93964.32,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 156607.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 57422.64,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 172267.92,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 287113.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 19575.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 58727.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D42HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 97879.5,
   "t": "Service"
  }
 ],
 "FortiGate 4201F": [
  {
   "sku": "FG-4201F",
   "d": "HW FG-4201F",
   "p": 332287,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 561543.05,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1020055.15,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1478567.25,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 521086.1,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 898684.3,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1276282.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F421F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 229256.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 687768.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1146280.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 188799.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 566397.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 943995.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 121370.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 364112.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 606854.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 80913.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 242741.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 404569.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 80913.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 242741.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 404569.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 134856.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 404569.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 674282.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 94399.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 283198.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 471997.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 80913.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 242741.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 404569.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 155084.98,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 465254.93,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 775424.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 112885.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 328655.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 544426,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F421F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 67428.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 202284.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 337141.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13485.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 40456.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 67428.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 13485.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 40456.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 67428.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 32365.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 97096.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 59336.86,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 178010.58,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 296684.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 20228.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 60685.43,
   "t": "Service"
  },
  {
   "sku": "FC-10-F421F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 101142.38,
   "t": "Service"
  },
  {
   "sku": "FG-4201F-DC",
   "d": "HW FG-4201F-DC",
   "p": 332287,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 561543.05,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1020055.15,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1478567.25,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 521086.1,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 898684.3,
   "t": "HW"
  },
  {
   "sku": "FG-4201F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1276282.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-D421F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 229256.05,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 687768.15,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1146280.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 188799.1,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 566397.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 943995.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 121370.85,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 364112.55,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 606854.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 80913.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 242741.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 404569.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 80913.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 242741.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 404569.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 134856.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 404569.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 674282.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 94399.55,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 283198.65,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 471997.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 80913.9,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 242741.7,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 404569.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 155084.98,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 465254.93,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 775424.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 112885.2,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 328655.6,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 544426,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D421F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 53942.6,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 269713,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 67428.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 202284.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 337141.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 13485.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 40456.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 67428.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 13485.65,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 40456.95,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 67428.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 32365.56,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 97096.68,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 161827.8,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 59336.86,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 178010.58,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 296684.3,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 20228.48,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 60685.43,
   "t": "Service"
  },
  {
   "sku": "FC-10-D421F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 101142.38,
   "t": "Service"
  },
  {
   "sku": "FG-4201F-LENC",
   "d": "HW FG-4201F-LENC",
   "p": 348901,
   "t": "HW"
  }
 ],
 "FortiGate 4400F": [
  {
   "sku": "FG-4400F",
   "d": "HW FG-4400F",
   "p": 417701,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 716561,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1314281,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1912001,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 663821,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1156061,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1648301,
   "t": "HW"
  },
  {
   "sku": "FC-10-F44HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 298860,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 896580,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1494300,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 246120,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 738360,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1230600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 158220,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 474660,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 791100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 105480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 316440,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 527400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 105480,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 316440,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 527400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 527400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 879000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123060,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369180,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615300,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 105480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 316440,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 527400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 202170,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 606510,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1010850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 145640,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 426920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 708200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F44HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 87900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 263700,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 439500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17580,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 52740,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 87900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17580,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 52740,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 87900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42192,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 126576,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 77352,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 232056,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 386760,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26370,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 79110,
   "t": "Service"
  },
  {
   "sku": "FC-10-F44HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 131850,
   "t": "Service"
  },
  {
   "sku": "FG-4400F-DC",
   "d": "HW FG-4400F-DC",
   "p": 417701,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 716561,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1314281,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1912001,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 663821,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1156061,
   "t": "HW"
  },
  {
   "sku": "FG-4400F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1648301,
   "t": "HW"
  },
  {
   "sku": "FC-10-D44HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 298860,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 896580,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1494300,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 246120,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 738360,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1230600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 158220,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 474660,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 791100,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 105480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 316440,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 527400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 105480,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 316440,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 527400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 527400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 879000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123060,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369180,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615300,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 105480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 316440,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 527400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 202170,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 606510,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1010850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 145640,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 426920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 708200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D44HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 70320,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 351600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 87900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 263700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 439500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17580,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 52740,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 87900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17580,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 52740,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 87900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42192,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 126576,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 210960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 77352,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 232056,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 386760,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26370,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 79110,
   "t": "Service"
  },
  {
   "sku": "FC-10-D44HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 131850,
   "t": "Service"
  },
  {
   "sku": "FG-4400F-LENC",
   "d": "HW FG-4400F-LENC",
   "p": 438586,
   "t": "HW"
  }
 ],
 "FortiGate 4401F": [
  {
   "sku": "FG-4401F",
   "d": "HW FG-4401F",
   "p": 424829,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 728789,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1336709,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1944629,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 675149,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1175789,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1676429,
   "t": "HW"
  },
  {
   "sku": "FC-10-F441F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 303960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 911880,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1519800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 250320,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 750960,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1251600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 160920,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 482760,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 804600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 107280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 321840,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 536400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 107280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 321840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 536400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 178800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 536400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 894000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 125160,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 375480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 625800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 107280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 321840,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 536400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 205620,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 616860,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1028100,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 148040,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 434120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 720200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F441F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 89400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 268200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 447000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17880,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 53640,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 89400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17880,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 53640,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 89400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42912,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 128736,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 78672,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 236016,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 393360,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26820,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 80460,
   "t": "Service"
  },
  {
   "sku": "FC-10-F441F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 134100,
   "t": "Service"
  },
  {
   "sku": "FG-4401F-DC",
   "d": "HW FG-4401F-DC",
   "p": 424829,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 728789,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1336709,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1944629,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 675149,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1175789,
   "t": "HW"
  },
  {
   "sku": "FG-4401F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1676429,
   "t": "HW"
  },
  {
   "sku": "FC-10-D441F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 303960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 911880,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1519800,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 250320,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 750960,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1251600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 160920,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 482760,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 804600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 107280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 321840,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 536400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 107280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 321840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 536400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 178800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 536400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 894000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 125160,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 375480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 625800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 107280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 321840,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 536400,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 205620,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 616860,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1028100,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 148040,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 434120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 720200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D441F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 71520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 357600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 89400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 268200,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 447000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17880,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 53640,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 89400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17880,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 53640,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 89400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42912,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 128736,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 214560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 78672,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 236016,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 393360,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26820,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 80460,
   "t": "Service"
  },
  {
   "sku": "FC-10-D441F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 134100,
   "t": "Service"
  },
  {
   "sku": "FG-4401F-LENC",
   "d": "HW FG-4401F-LENC",
   "p": 446070,
   "t": "HW"
  }
 ],
 "FortiGate 4800F": [
  {
   "sku": "FG-4800F",
   "d": "HW FG-4800F",
   "p": 451440,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 800280,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1497960,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2195640,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 738720,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1313280,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1887840,
   "t": "HW"
  },
  {
   "sku": "FC-10-F48HF-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 348840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1046520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1744200,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 287280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 861840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1436400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 184680,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 554040,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 923400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 123120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 369360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 615600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 123120,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 369360,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 615600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-159-02-12",
   "d": "1 Year IS SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-159-02-36",
   "d": "3 Year IS SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-159-02-60",
   "d": "5 Year IS SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 205200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 615600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1026000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 143640,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 430920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 718200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 123120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 369360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 615600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 235980,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 707940,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1179900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 169160,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 497480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 825800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F48HF-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 102600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 307800,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 513000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 61560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 102600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20520,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 61560,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 102600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49248,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 147744,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 90288,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 270864,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 451440,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 30780,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 92340,
   "t": "Service"
  },
  {
   "sku": "FC-10-F48HF-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 153900,
   "t": "Service"
  },
  {
   "sku": "FG-4800F-DC",
   "d": "HW FG-4800F-DC",
   "p": 451440,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-DC-BDL-809-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 800280,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-DC-BDL-809-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1497960,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-DC-BDL-809-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2195640,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 738720,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1313280,
   "t": "HW"
  },
  {
   "sku": "FG-4800F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1887840,
   "t": "HW"
  },
  {
   "sku": "FC-10-D480F-809-02-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 348840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-809-02-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1046520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-809-02-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1744200,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 287280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 861840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1436400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 184680,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 554040,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 923400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 123120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 369360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 615600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 123120,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 369360,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 615600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 205200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 615600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1026000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 143640,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 430920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 718200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 123120,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 369360,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 615600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 235980,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 707940,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1179900,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 169160,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 497480,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 825800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D480F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 82080,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 410400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 102600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 307800,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 513000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 61560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 102600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20520,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 61560,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 102600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49248,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 147744,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 246240,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 90288,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 270864,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 451440,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 30780,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 92340,
   "t": "Service"
  },
  {
   "sku": "FC-10-D480F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 153900,
   "t": "Service"
  }
 ],
 "FortiGate 4801F": [
  {
   "sku": "FG-4801F",
   "d": "HW FG-4801F",
   "p": 458040,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 811980,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1519860,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2227740,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 749520,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1332480,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1915440,
   "t": "HW"
  },
  {
   "sku": "FC-10-F481F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 353940,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1061820,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1769700,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 291480,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 874440,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1457400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 187380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 562140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 936900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 124920,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 374760,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 624600,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 208200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1041000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 145740,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 437220,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 728700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 239430,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 718290,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1197150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 171560,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 504680,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 837800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F481F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 312300,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 520500,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49968,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 149904,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 91608,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 274824,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 458040,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 31230,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 93690,
   "t": "Service"
  },
  {
   "sku": "FC-10-F481F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 156150,
   "t": "Service"
  },
  {
   "sku": "FG-4801F-DC",
   "d": "HW FG-4801F-DC",
   "p": 458040,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-BDL-809-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 811980,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-BDL-809-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1519860,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-BDL-809-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2227740,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 749520,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1332480,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1915440,
   "t": "HW"
  },
  {
   "sku": "FC-10-D481F-809-02-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 353940,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-809-02-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1061820,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-809-02-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1769700,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 291480,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 874440,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1457400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 187380,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 562140,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 936900,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 124920,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 374760,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 624600,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 208200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1041000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 145740,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 437220,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 728700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 239430,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 718290,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1197150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 171560,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 504680,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 837800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-D481F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 312300,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 520500,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49968,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 149904,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 91608,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 274824,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 458040,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 31230,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 93690,
   "t": "Service"
  },
  {
   "sku": "FC-10-D481F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 156150,
   "t": "Service"
  },
  {
   "sku": "FG-4801F-DC-NEBS",
   "d": "HW FG-4800F-DC-NEBS",
   "p": 458040,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-NEBS-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 811980,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-NEBS-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1519860,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-NEBS-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2227740,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-NEBS-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 749520,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-NEBS-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1332480,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-DC-NEBS-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1915440,
   "t": "HW"
  },
  {
   "sku": "FC-10-ND481-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 353940,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1061820,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1769700,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 291480,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 874440,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1457400,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 187380,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 562140,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 936900,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 124920,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 374760,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 624600,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-159-02-12",
   "d": "1 Year IS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-159-02-36",
   "d": "3 Year IS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-159-02-60",
   "d": "5 Year IS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 208200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1041000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 145740,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 437220,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 728700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 239430,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 718290,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1197150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 171560,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 504680,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 837800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-ND481-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 312300,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 520500,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49968,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 149904,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 91608,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 274824,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 458040,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 31230,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 93690,
   "t": "Service"
  },
  {
   "sku": "FC-10-ND481-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 156150,
   "t": "Service"
  },
  {
   "sku": "FG-4801F-NEBS",
   "d": "HW FG-4801F-DC-NEBS",
   "p": 458040,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-NEBS-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 811980,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-NEBS-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1519860,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-NEBS-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2227740,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-NEBS-BDL-950-12",
   "d": "1 Year HW, FC Premium & UTP BDL SVC",
   "p": 749520,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-NEBS-BDL-950-36",
   "d": "3 Year HW, FC Premium & UTP BDL SVC",
   "p": 1332480,
   "t": "HW"
  },
  {
   "sku": "FG-4801F-NEBS-BDL-950-60",
   "d": "5 Year HW, FC Premium & UTP BDL SVC",
   "p": 1915440,
   "t": "HW"
  },
  {
   "sku": "FC-10-G481F-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 353940,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1061820,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1769700,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 291480,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 874440,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1457400,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-928-02-12",
   "d": "1 Year FC Premium & ATP BDL SVC",
   "p": 187380,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-928-02-36",
   "d": "3 Year FC Premium & ATP BDL SVC",
   "p": 562140,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-928-02-60",
   "d": "5 Year FC Premium & ATP BDL SVC",
   "p": 936900,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-100-02-12",
   "d": "1 Year AMP SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-100-02-36",
   "d": "3 Year AMP SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-100-02-60",
   "d": "5 Year AMP SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-108-02-12",
   "d": "1 Year IPS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-108-02-36",
   "d": "3 Year IPS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-108-02-60",
   "d": "5 Year IPS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 124920,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 374760,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 624600,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-159-02-12",
   "d": "1 Year IS SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-159-02-36",
   "d": "3 Year IS SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-159-02-60",
   "d": "5 Year IS SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 208200,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1041000,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 145740,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 437220,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 728700,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-585-02-12",
   "d": "1 Year Sub to CLD based Central Logging",
   "p": 124920,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-585-02-36",
   "d": "3 Year Sub to CLD based Central Logging",
   "p": 374760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-585-02-60",
   "d": "5 Year Sub to CLD based Central Logging",
   "p": 624600,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 239430,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 718290,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1197150,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 171560,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 504680,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 837800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-G481F-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 83280,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 416400,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 312300,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 520500,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 20820,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 62460,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 104100,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 49968,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 149904,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 249840,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 91608,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 274824,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 458040,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 31230,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 93690,
   "t": "Service"
  },
  {
   "sku": "FC-10-G481F-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 156150,
   "t": "Service"
  }
 ],
 "FortiGate 7081F": [
  {
   "sku": "FG-7081F-DC-CH",
   "d": "HW FG-7081F-DC-CH",
   "p": 146000,
   "t": "HW"
  },
  {
   "sku": "FG-7081F",
   "d": "HW FG-7801F",
   "p": 445154,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 744269,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1342499,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1940729,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 691484,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1184144,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1676804,
   "t": "HW"
  },
  {
   "sku": "FC-10-F78F1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 299115,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 897345,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1495575,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 246330,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 738990,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1231650,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 158355,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 475065,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 791775,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-100-02-12",
   "d": "1 Year AV SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-100-02-36",
   "d": "3 Year AV SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-100-02-60",
   "d": "5 Year AV SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 105570,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 316710,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 105570,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 316710,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 527850,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175950,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 879750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123165,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369495,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615825,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 202342.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 607027.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1011712.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 145760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 427280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 708800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 263925,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 439875,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42228,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 126684,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 77418,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 232254,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 387090,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26392.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 79177.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 131962.5,
   "t": "Service"
  },
  {
   "sku": "FG-7081F-2",
   "d": "HW FG-7801F-2",
   "p": 425799,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 724914,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1323144,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1921374,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 672129,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1164789,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1657449,
   "t": "HW"
  },
  {
   "sku": "FC-10-F78F2-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 299115,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 897345,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1495575,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 246330,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 738990,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1231650,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 158355,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 475065,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 791775,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-100-02-12",
   "d": "1 Year AV SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-100-02-36",
   "d": "3 Year AV SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-100-02-60",
   "d": "5 Year AV SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 105570,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 316710,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 105570,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 316710,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 527850,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-159-02-12",
   "d": "1 Year IS SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-159-02-36",
   "d": "3 Year IS SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-159-02-60",
   "d": "5 Year IS SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175950,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 879750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123165,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369495,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615825,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 202342.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 607027.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1011712.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 145760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 427280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 708800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F78F2-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 263925,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 439875,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42228,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 126684,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 77418,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 232254,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 387090,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26392.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 79177.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F78F2-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 131962.5,
   "t": "Service"
  },
  {
   "sku": "FG-7081F-2-DC",
   "d": "HW FG-7081F-2-DC",
   "p": 425799,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-DC-BDL-809-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 724914,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-DC-BDL-809-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1323144,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-DC-BDL-809-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1921374,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-DC-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 672129,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-DC-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1164789,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-2-DC-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1657449,
   "t": "HW"
  },
  {
   "sku": "FC-10-F782D-809-02-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 299115,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-809-02-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 897345,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-809-02-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1495575,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 246330,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 738990,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1231650,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 158355,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 475065,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 791775,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-100-02-12",
   "d": "1 Year AV SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-100-02-36",
   "d": "3 Year AV SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-100-02-60",
   "d": "5 Year AV SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 105570,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 316710,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 105570,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 316710,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 527850,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-159-02-12",
   "d": "1 Year IS SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-159-02-36",
   "d": "3 Year IS SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-159-02-60",
   "d": "5 Year IS SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175950,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 879750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123165,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369495,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615825,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 202342.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 607027.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1011712.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 145760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 427280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 708800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F782D-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 263925,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 439875,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42228,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 126684,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 77418,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 232254,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 387090,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26392.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 79177.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F782D-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 131962.5,
   "t": "Service"
  },
  {
   "sku": "FG-7081F-DC",
   "d": "HW FG-7081F-DC",
   "p": 425799,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-DC-BDL-809-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 724914,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-DC-BDL-809-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1323144,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-DC-BDL-809-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 1921374,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-DC-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 672129,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-DC-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1164789,
   "t": "HW"
  },
  {
   "sku": "FG-7081F-DC-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1657449,
   "t": "HW"
  },
  {
   "sku": "FC-10-F781D-809-02-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 299115,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-809-02-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 897345,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-809-02-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1495575,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 246330,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 738990,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 1231650,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 158355,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 475065,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 791775,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-100-02-12",
   "d": "1 Year AV SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-100-02-36",
   "d": "3 Year AV SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-100-02-60",
   "d": "5 Year AV SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 105570,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 316710,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 105570,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 316710,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 527850,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-159-02-12",
   "d": "1 Year IS SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-159-02-36",
   "d": "3 Year IS SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-159-02-60",
   "d": "5 Year IS SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 175950,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 527850,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 879750,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 123165,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 369495,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 615825,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 202342.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 607027.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1011712.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 145760,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 427280,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 708800,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F781D-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 70380,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 351900,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 263925,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 439875,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 17595,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 52785,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 87975,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 42228,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 126684,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 211140,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 77418,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 232254,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 387090,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 26392.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 79177.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F781D-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 131962.5,
   "t": "Service"
  }
 ],
 "FortiGate 7121F": [
  {
   "sku": "FG-7121F-DC-CH",
   "d": "HW FG-7121F-DC-CH",
   "p": 184785,
   "t": "HW"
  },
  {
   "sku": "FG-7121F",
   "d": "HW FG-7121F",
   "p": 725225,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1285625.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2406427.25,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3527228.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1186731.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 2109744.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 3032757.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F7CF1-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 560400.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1681202.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2802003.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 461506.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1384519.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2307532.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 296682.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 890048.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 1483413.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-100-02-12",
   "d": "1 Year AV SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-100-02-36",
   "d": "3 Year AV SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-100-02-60",
   "d": "5 Year AV SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 197788.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 593365.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 197788.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 593365.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 988942.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-159-02-12",
   "d": "1 Year IS SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-159-02-36",
   "d": "3 Year IS SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-159-02-60",
   "d": "5 Year IS SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 329647.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1648237.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 230753.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 692259.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1153766.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 379094.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1137283.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1895473.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 268718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 796154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 1323590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF1-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 494471.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 824118.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 79115.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 237346.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 145044.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 435134.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 725224.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 49447.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 148341.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF1-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 247235.63,
   "t": "Service"
  },
  {
   "sku": "FG-7121F-2",
   "d": "HW FG-7121F-2",
   "p": 725225,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1285625.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2406427.25,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3527228.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1186731.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 2109744.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 3032757.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-F7CF2-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 560400.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1681202.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2802003.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 461506.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1384519.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2307532.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 296682.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 890048.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 1483413.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-100-02-12",
   "d": "1 Year AV SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-100-02-36",
   "d": "3 Year AV SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-100-02-60",
   "d": "5 Year AV SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 197788.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 593365.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 197788.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 593365.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 988942.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-159-02-12",
   "d": "1 Year IS SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-159-02-36",
   "d": "3 Year IS SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-159-02-60",
   "d": "5 Year IS SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 329647.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1648237.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 230753.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 692259.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1153766.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 379094.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1137283.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1895473.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 268718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 796154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 1323590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-F7CF2-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 494471.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 824118.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 79115.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 237346.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 145044.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 435134.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 725224.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 49447.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 148341.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-F7CF2-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 247235.63,
   "t": "Service"
  },
  {
   "sku": "FG-7121F-2-DC",
   "d": "HW FG-7121F-2-DC",
   "p": 725225,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1285625.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2406427.25,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3527228.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-DC-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1186731.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-DC-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 2109744.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-2-DC-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 3032757.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-7CF2D-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 560400.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1681202.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2802003.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 461506.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1384519.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2307532.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 296682.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 890048.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 1483413.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-100-02-12",
   "d": "1 Year AV SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-100-02-36",
   "d": "3 Year AV SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-100-02-60",
   "d": "5 Year AV SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 197788.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 593365.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 197788.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 593365.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 988942.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-159-02-12",
   "d": "1 Year IS SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-159-02-36",
   "d": "3 Year IS SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-159-02-60",
   "d": "5 Year IS SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 329647.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1648237.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 230753.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 692259.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1153766.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 379094.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1137283.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1895473.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 268718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 796154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 1323590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF2D-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 494471.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 824118.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 79115.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 237346.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 145044.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 435134.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 725224.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 49447.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 148341.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF2D-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 247235.63,
   "t": "Service"
  },
  {
   "sku": "FG-7121F-DC",
   "d": "HW FG-7121F-DC",
   "p": 725225,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-DC-BDL-809-12",
   "d": "1 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 1285625.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-DC-BDL-809-36",
   "d": "3 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 2406427.25,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-DC-BDL-809-60",
   "d": "5 Year HW, FC Premium & ENT BDL SVC 7.4",
   "p": 3527228.75,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-DC-BDL-950-12",
   "d": "1 Year HW, 1 YR FC Premium & UTP FG",
   "p": 1186731.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-DC-BDL-950-36",
   "d": "3 Year HW, 1 YR FC Premium & UTP FG",
   "p": 2109744.5,
   "t": "HW"
  },
  {
   "sku": "FG-7121F-DC-BDL-950-60",
   "d": "5 Year HW, 1 YR FC Premium & UTP FG",
   "p": 3032757.5,
   "t": "HW"
  },
  {
   "sku": "FC-10-7CF1D-809-02-12",
   "d": "1 Year Enterprise Protection SVC 7.4",
   "p": 560400.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-809-02-36",
   "d": "3 Year Enterprise Protection SVC 7.4",
   "p": 1681202.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-809-02-60",
   "d": "5 Year Enterprise Protection SVC 7.4",
   "p": 2802003.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-950-02-12",
   "d": "1 Year FC Premium & UTP BDL SVC",
   "p": 461506.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-950-02-36",
   "d": "3 Year FC Premium & UTP BDL SVC",
   "p": 1384519.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-950-02-60",
   "d": "5 Year FC Premium & UTP BDL SVC",
   "p": 2307532.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-928-02-12",
   "d": "1 Year FC Premium & TP BDL SVC",
   "p": 296682.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-928-02-36",
   "d": "3 Year FC Premium & TP BDL SVC",
   "p": 890048.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-928-02-60",
   "d": "5 Year FC Premium & TP BDL SVC",
   "p": 1483413.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-100-02-12",
   "d": "1 Year AV SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-100-02-36",
   "d": "3 Year AV SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-100-02-60",
   "d": "5 Year AV SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-577-02-12",
   "d": "1 Year FG AI based Sandbox SVC",
   "p": 197788.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-577-02-36",
   "d": "3 Year FG AI based Sandbox SVC",
   "p": 593365.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-577-02-60",
   "d": "5 Year FG AI based Sandbox SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-108-02-12",
   "d": "1 Year NGFW Service",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-108-02-36",
   "d": "3 Year NGFW Service",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-108-02-60",
   "d": "5 Year NGFW Service",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-112-02-12",
   "d": "1 Year WF & VF SVC",
   "p": 197788.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-112-02-36",
   "d": "3 Year WF & VF SVC",
   "p": 593365.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-112-02-60",
   "d": "5 Year WF & VF SVC",
   "p": 988942.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-159-02-12",
   "d": "1 Year IS SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-159-02-36",
   "d": "3 Year IS SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-159-02-60",
   "d": "5 Year IS SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-1329-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 329647.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-1329-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 988942.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-1329-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1648237.5,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-1389-02-12",
   "d": "1 Year SD-WAN BDL SVC",
   "p": 230753.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-1389-02-36",
   "d": "3 Year SD-WAN BDL SVC",
   "p": 692259.75,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-1389-02-60",
   "d": "5 Year SD-WAN BDL SVC",
   "p": 1153766.25,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-589-02-12",
   "d": "1 Year Data Loss Prevention SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-589-02-36",
   "d": "3 Year Data Loss Prevention SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-589-02-60",
   "d": "5 Year Data Loss Prevention SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-464-02-12",
   "d": "1 Year FAZ SOCaaS SVC",
   "p": 379094.63,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-464-02-36",
   "d": "3 Year FAZ SOCaaS SVC",
   "p": 1137283.88,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-464-02-60",
   "d": "5 Year FAZ SOCaaS SVC",
   "p": 1895473.13,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-660-02-12",
   "d": "1 Year Managed 24x7 Service",
   "p": 268718,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-660-02-36",
   "d": "3 Year Managed 24x7 Service",
   "p": 796154,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-660-02-60",
   "d": "5 Year Managed 24x7 Service",
   "p": 1323590,
   "t": "SaaS"
  },
  {
   "sku": "FC-10-7CF1D-189-02-12",
   "d": "1 Year FCT SVC",
   "p": 5000,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-247-02-12",
   "d": "1 Year FC Premium SVC",
   "p": 131859,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-247-02-36",
   "d": "3 Year FC Premium SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-247-02-60",
   "d": "5 Year FC Premium SVC",
   "p": 659295,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-284-02-12",
   "d": "1 Year FC Elite SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-284-02-36",
   "d": "3 Year FC Elite SVC",
   "p": 494471.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-284-02-60",
   "d": "5 Year FC Elite SVC",
   "p": 824118.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-204-02-12",
   "d": "1 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-204-02-36",
   "d": "3 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-204-02-60",
   "d": "5 Year Upgrade FortiCare Premium to Elite (Require FortiCare Premium)",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-210-02-12",
   "d": "1 Year NDD Delivery PRMA SVC",
   "p": 32964.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-210-02-36",
   "d": "3 Year NDD Delivery PRMA SVC",
   "p": 98894.25,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-210-02-60",
   "d": "5 Year NDD Delivery PRMA SVC",
   "p": 164823.75,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-211-02-12",
   "d": "1 Year 4HRS Delivery PRMA SVC",
   "p": 79115.4,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-211-02-36",
   "d": "3 Year 4HRS Delivery PRMA SVC",
   "p": 237346.2,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-211-02-60",
   "d": "5 Year 4HRS Delivery PRMA SVC",
   "p": 395577,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-212-02-12",
   "d": "1 Year 4HRS Onsite PRMA SVC",
   "p": 145044.9,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-212-02-36",
   "d": "3 Year 4HRS Onsite PRMA SVC",
   "p": 435134.7,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-212-02-60",
   "d": "5 Year 4HRS Onsite PRMA SVC",
   "p": 725224.5,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-301-02-12",
   "d": "1 Year SRMA SVC",
   "p": 49447.13,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-301-02-36",
   "d": "3 Year SRMA SVC",
   "p": 148341.38,
   "t": "Service"
  },
  {
   "sku": "FC-10-7CF1D-301-02-60",
   "d": "5 Year SRMA SVC",
   "p": 247235.63,
   "t": "Service"
  }
 ]
};

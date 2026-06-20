// src/supervisorTable.mjs — grupos de supervisores → tabla HTML "navy" del correo
// (encabezados azul oscuro, texto blanco centrado, filas numeradas, nombre - teléfono).
import { CONFIG } from './config.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Títulos tal como salen en el correo (mayúsculas).
const NAVY_TITLES = {
  Centro: 'SUPERVISOR DE CENTRO OPERACIONES',
  Rampa1: 'SUPERVISOR DE OPERACIONES RAMPA 1',
  MakeUp: 'SUPERVISOR DE OPERACIONES MAKE UP',
};

export function renderSupervisorTable(groups, { reportDay }) {
  const navy = CONFIG.navyColor;
  const W = CONFIG.table.width;
  const [y, m, d] = reportDay.split('-').map(Number);
  const fecha = `${m}/${d}/${y}`;   // formato del correo (M/D/AAAA)

  // La fuente va EN CADA celda: Outlook de escritorio (motor de Word) no la hereda
  // del <table> y las celdas caerían a Times New Roman en una PC corporativa.
  const f = `font-family:Arial, sans-serif;font-size:${CONFIG.table.fontSize}`;
  // Padding compacto (más estilizado): se redujo el espacio celda-borde respecto a
  // la versión anterior (4/3px vert · 6/8px horiz) para que la tabla quede más fina.
  const head = `${f};background:${navy};color:#ffffff;font-weight:bold;text-align:center;border:1px solid #000000;padding:2px 6px`;
  const cell = `${f};color:#000000;border:1px solid #000000;padding:2px 5px;text-align:center`;
  const cellName = `${f};color:#000000;border:1px solid #000000;padding:2px 6px;text-align:left`;

  // título superior (faltaba) + fila de fecha (en una sola celda para que no se parta)
  let rows = `<tr><td colspan="3" style="${head}">${esc(CONFIG.supervisorTitle)}</td></tr>`
    + `<tr><td colspan="3" style="${cell};text-align:left;font-weight:bold">Fecha:&nbsp;&nbsp;${fecha}</td></tr>`;

  for (const g of groups) {
    rows += `<tr><td colspan="2" style="${head}">${NAVY_TITLES[g.key] || esc(g.title)}</td>`
      + `<td width="95" style="${head}">HORARIO</td></tr>`;
    for (const r of g.rows) {
      // width en atributo HTML además del colgroup: Word ignora <col>, así las columnas
      // (nº 30 · nombre auto · horario 95) quedan iguales en Outlook y en el navegador.
      rows += `<tr><td width="30" style="${cell}">${r.n}</td>`
        + `<td style="${cellName}">${esc(r.name)} - ${esc(r.phone)}</td>`
        + `<td width="95" style="${cell}">${esc(r.shift)}</td></tr>`;
    }
  }
  // columnas: nº (30) · nombre (auto) · horario (95) · total ≈ 530 para que coincida con la firma
  return `<table width="${W}" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;`
    + `width:${W}px;font-family:Arial, sans-serif;font-size:${CONFIG.table.fontSize};margin:12px 0">`
    + `<colgroup><col style="width:30px"><col><col style="width:95px"></colgroup>${rows}</table>`;
}

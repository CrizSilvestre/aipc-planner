// src/amsParse.mjs — parsea el pegado de AMS (texto TSV, 16 columnas en orden fijo)
// → registros de vuelo. Sin DOM, testeable en Node.
const COLS = ['airline', 'arrFlight', 'depFlight', 'sta', 'std', 'from', 'to',
  'acType', 'handler', 'paxIn', 'paxTransito', 'paxOut', 'correa', 'stand', 'gate', 'ckin'];

// Acepta ISO/año-primero ("2026-06-20", "2026/06/20") o con barras ("20/6/26",
// "6/20/2026"), con o sin AM/PM. La hora se extrae siempre. En el formato con barras
// NO decide aún día/mes vs mes/día: deja los componentes en _c1/_c2 y el formato lo
// detecta parseAmsClipboard a partir del lote → funciona en cualquier computadora
// (local D/M o corporativa US M/D), sin que todo salga OVER por una fecha mal leída.
export function parseDateTime(s) {
  s = (s || '').trim();
  if (!s) return null;
  const tm = s.match(/(\d{1,2}):(\d{2})/);
  let h = tm ? +tm[1] : null;
  const mi = tm ? +tm[2] : null;
  const ap = (s.match(/\b([AaPp])\.?\s*[Mm]\b/) || [])[1];
  if (ap && h != null) { const pm = /p/i.test(ap); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }

  let m = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);        // año primero (ISO)
  if (m) return { y: +m[1], mo: +m[2], d: +m[3], h, mi };

  m = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);           // D/M o M/D (se decide por lote)
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    return { y, _c1: +m[1], _c2: +m[2], h, mi };
  }
  return { h, mi, raw: s };   // sin fecha, pero con hora
}

// Detecta el formato del lote: si algún primer número es >12 → día/mes (D/M);
// si algún segundo número es >12 → mes/día (M/D). Por defecto D/M.
export function finalizeDateFormat(records) {
  let dm = 0; let md = 0;
  for (const rec of records) {
    for (const dt of [rec.staDT, rec.stdDT]) {
      if (dt && dt._c1 != null) {
        if (dt._c1 > 12 && dt._c2 <= 12) dm++;
        else if (dt._c2 > 12 && dt._c1 <= 12) md++;
      }
    }
  }
  const dayFirst = !(md > dm);   // por defecto D/M; M/D solo si gana
  for (const rec of records) {
    for (const dt of [rec.staDT, rec.stdDT]) {
      if (dt && dt._c1 != null) {
        dt.d = dayFirst ? dt._c1 : dt._c2;
        dt.mo = dayFirst ? dt._c2 : dt._c1;
      }
    }
  }
  return { dayFirst, dm, md };
}

export function parseAmsClipboard(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim());
  const out = [];
  for (const line of lines) {
    const cells = line.split('\t');
    if (/^airlines?$/i.test((cells[0] || '').trim())) continue; // header
    if (cells.length < 14) continue;                            // no es fila de datos
    const rec = {};
    COLS.forEach((k, i) => { rec[k] = (cells[i] !== undefined ? cells[i] : '').trim(); });
    rec.staDT = parseDateTime(rec.sta);
    rec.stdDT = parseDateTime(rec.std);
    out.push(rec);
  }
  finalizeDateFormat(out);   // decide D/M vs M/D del lote y completa d/mo
  return out;
}

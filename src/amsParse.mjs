// src/amsParse.mjs — parsea el pegado de AMS (texto TSV, 16 columnas en orden fijo)
// → registros de vuelo. Sin DOM, testeable en Node.
const COLS = ['airline', 'arrFlight', 'depFlight', 'sta', 'std', 'from', 'to',
  'acType', 'handler', 'paxIn', 'paxTransito', 'paxOut', 'correa', 'stand', 'gate', 'ckin'];

// Acepta ISO "2026-06-20 11:55" o slash "20/6/26 11:55" (AMS = SIEMPRE día/mes),
// con o sin AM/PM. La hora se extrae siempre (para mostrar solo la hora).
export function parseDateTime(s) {
  s = (s || '').trim();
  if (!s) return null;
  const tm = s.match(/(\d{1,2}):(\d{2})/);
  let h = tm ? +tm[1] : null;
  const mi = tm ? +tm[2] : null;
  const ap = (s.match(/\b([AaPp])\.?\s*[Mm]\b/) || [])[1];
  if (ap && h != null) { const pm = /p/i.test(ap); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }

  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);           // ISO
  if (m) return { y: +m[1], mo: +m[2], d: +m[3], h, mi };

  m = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);        // AMS: SIEMPRE día/mes (D/M)
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    return { y, mo: +m[2], d: +m[1], h, mi };
  }
  return { h, mi, raw: s };   // sin fecha, pero con hora
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
  return out;
}

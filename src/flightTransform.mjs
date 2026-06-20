// src/flightTransform.mjs — registros de vuelo → filas de la plantilla APC.
// Reglas descubiertas (trazables a los archivos del cliente):
//  - VUELO No.  = Llegada & "/" & número(Salida)  (normal; en OVER solo el vuelo que operó)
//  - RUTA       = FROM-PUJ-TO (normal) · PUJ-TO (OVER_IN) · FROM-PUJ (OVER_OUT) · PUJ (OVER doble)
//  - OVER_IN    = STA día anterior → STA="OVER", solo salida, PAX IN/TRÁNSITO = N/A
//  - OVER_OUT   = STD día posterior → STD="OVER", solo llegada, PAX OUT = N/A
//  - N/A        = PAX vacío O 0 → "N/A"; CORREA/GATE vacío → "N/A"; STAND obligatorio
const NA = 'N/A';
const isEmpty = (v) => v === null || v === undefined
  || String(v).trim() === '' || String(v).trim().toLowerCase() === 'none';
const naIf = (v) => (isEmpty(v) ? NA : String(v).trim());
// PAX: además de vacío, un 0 también es N/A (parche del personal cuando AMS no acepta
// N/A; un ferry con 0 real lo editan a mano en el Excel).
const naPax = (v) => (isEmpty(v) || String(v).trim() === '0' ? NA : String(v).trim());
const isoDay = (dt) => (dt && dt.y ? `${dt.y}-${String(dt.mo).padStart(2, '0')}-${String(dt.d).padStart(2, '0')}` : null);
const fmtTime = (dt) => (dt && dt.h != null ? `${dt.h}:${String(dt.mi).padStart(2, '0')}` : '');

function flightNo(arr, dep) {
  arr = (arr || '').trim(); dep = (dep || '').trim();
  const i = dep.indexOf(' ');
  const num = i >= 0 ? dep.slice(i + 1).trim() : dep;
  return num ? `${arr}/${num}` : arr;
}
// Clave numérica para ordenar por fecha/hora; sin fecha → al final.
const dtNum = (dt) => (dt && dt.y != null
  ? dt.y * 1e8 + dt.mo * 1e6 + dt.d * 1e4 + dt.h * 100 + dt.mi
  : Number.POSITIVE_INFINITY);

// flights → filas APC.
// Orden: los OVER (STA=OVER) van ARRIBA (por STD); el resto por STA ascendente.
export function toApcRows(flights, { reportDay }) {
  const rows = flights.map((f) => {
    const sd = isoDay(f.staDT);
    const dd = isoDay(f.stdDT);
    const overIn = !!(sd && sd < reportDay);    // llegó antes del día → solo opera la salida
    const overOut = !!(dd && dd > reportDay);   // sale después del día → solo opera la llegada

    let paxIn = naPax(f.paxIn);
    let paxTransito = naPax(f.paxTransito);
    let paxOut = naPax(f.paxOut);
    if (overIn) { paxIn = NA; paxTransito = NA; }
    if (overOut) { paxOut = NA; }

    // OVER: solo se muestra la dirección que operó (vuelo + ruta).
    const from = (f.from || '').trim();
    const to = (f.to || '').trim();
    let vueloNo;
    let rutaVal;
    if (overIn && overOut) { vueloNo = flightNo(f.arrFlight, f.depFlight); rutaVal = 'PUJ'; }
    else if (overIn) { vueloNo = (f.depFlight || '').trim(); rutaVal = `PUJ-${to}`; }
    else if (overOut) { vueloNo = (f.arrFlight || '').trim(); rutaVal = `${from}-PUJ`; }
    else { vueloNo = flightNo(f.arrFlight, f.depFlight); rutaVal = `${from}-PUJ-${to}`; }

    return {
      aerolinea: (f.airline || '').trim(),
      vueloNo,
      sta: overIn ? 'OVER' : fmtTime(f.staDT),
      std: overOut ? 'OVER' : fmtTime(f.stdDT),
      ruta: rutaVal,
      acType: (f.acType || '').trim(),
      handler: (f.handler || '').trim(),
      paxIn, paxTransito, paxOut,
      correa: naIf(f.correa),
      stand: (f.stand || '').trim(),   // obligatorio (la validación marca si falta)
      gate: naIf(f.gate),
      ckin: (f.ckin || '').trim(),
      over: overIn && overOut ? 'BOTH' : overIn ? 'IN' : overOut ? 'OUT' : null,
      _staKey: dtNum(f.staDT),
      _stdKey: dtNum(f.stdDT),
    };
  });

  rows.sort((a, b) => {
    const aTop = a.sta === 'OVER';
    const bTop = b.sta === 'OVER';
    if (aTop !== bTop) return aTop ? -1 : 1;   // OVER (STA=OVER) arriba del todo
    if (aTop) return a._stdKey - b._stdKey;    // dentro del grupo OVER, por STD
    return a._staKey - b._staKey;              // el resto, por STA ascendente
  });
  rows.forEach((r, i) => { r.vuelo = i + 1; });
  return rows;
}

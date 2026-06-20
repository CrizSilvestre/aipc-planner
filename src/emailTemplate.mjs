// src/emailTemplate.mjs — cuerpo del correo corporativo (estructura fija) + tabla
// navy + firma. Reproduce el correo real (asunto, saludo, nota, slots, etc.).
import { CONFIG } from './config.mjs';
import { renderSupervisorTable } from './supervisorTable.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaMedia = (reportDay) => {
  const [y, m, d] = reportDay.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} ${y}`;        // "20 de junio 2026"
};

export function buildEmailHtml(groups, { reportDay, signatureHtml } = {}) {
  const cfg = CONFIG;
  const p = (html) => `<p style="margin:0 0 11pt">${html}</p>`;

  const parts = [
    p('Saludos'),
    p('Estimados,'),
    p(`Adjunto encontrarán la asignación de Correas, Posiciones &amp; Gates AIPC correspondiente al `
      + `<strong>${esc(fechaMedia(reportDay))}</strong> para <strong>${esc(cfg.terminals)}</strong>.`),
    p('Cualquier cambio en la programación les será notificado por las vías correspondientes.'),
    p(`Nota: Información disponible en tiempo real a través de la plataforma `
      + `<a href="${cfg.dashboardUrl}">${cfg.dashboardUrl}</a>`),
    p(`Solicite el usuario enviando un correo a `
      + `<a href="mailto:${cfg.slotsEmail}">${cfg.slotsEmail}</a>`),
    renderSupervisorTable(groups, { reportDay }),
    signatureHtml || cfg.signatureHtml || '',
  ];

  return `<div style="font-family:${cfg.font.family};font-size:${cfg.font.size};color:#000000;line-height:1.45">\n`
    + `${parts.filter(Boolean).join('\n')}\n</div>`;
}

// ============================================================
//  pdf.js — Reporte PDF con identidad visual TEC Emprende Lab.
//  Usa jsPDF + jspdf-autotable. Todo client-side.
//
//  API:
//    exportReportToPDF({ participants, courses, tags, sections })
//  sections: { summary, courses, tagsBreakdown, list } — booleans.
// ============================================================

import jsPDF       from 'jspdf'
import autoTable   from 'jspdf-autotable'
import {
  daysLeft, isExpired, isWarning, todayISO,
} from './time.js'

// ---------- Paleta (sincronizada con global.css) ----------
const COLOR = {
  cream:    '#FAF6EE',
  cream2:   '#F2EBD9',
  border:   '#D4C8B0',
  orange:   '#E8651A',
  orangeD:  '#C04E0E',
  black:    '#1A1612',
  gray:     '#8A8070',
  white:    '#FFFFFF',
  redText:  '#791F1F',
  greenTxt: '#2A5940',
}

// ---------- Helpers ----------
function shortName(id, courses) {
  return courses.find(c => c.id === id)?.short || id
}
function tagName(id, tags) {
  return tags.find(t => t.id === id)?.name || id
}

function fmtDateLong(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso))
  } catch { return iso }
}

function fmtDateRange(start, end) {
  if (!start && !end) return '—'
  // Usamos guión simple porque Helvetica (WinAnsi) no soporta "→".
  return `${fmtDateLong(start)} - ${fmtDateLong(end)}`
}

function generatedAt() {
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date())
}

// ---------- Header / Footer ----------
function drawHeader(doc, pageW) {
  doc.setFillColor(COLOR.orange)
  doc.rect(0, 0, pageW, 60, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(COLOR.white)
  doc.text('TEC Emprende Lab', 40, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Reporte de Participantes', 40, 46)

  doc.setFontSize(9)
  doc.text(`Generado: ${generatedAt()}`, pageW - 40, 30, { align: 'right' })
}

function drawFooter(doc, pageW, pageH, pageN, totalPages) {
  doc.setDrawColor(COLOR.border)
  doc.setLineWidth(0.5)
  doc.line(40, pageH - 30, pageW - 40, pageH - 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(COLOR.gray)
  doc.text('tecemprendelab@itcr.ac.cr  ·  2550-9270', 40, pageH - 16)
  doc.text(`Página ${pageN} / ${totalPages}`, pageW - 40, pageH - 16, { align: 'right' })
}

function drawSectionTitle(doc, text, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(COLOR.black)
  doc.text(text, 40, y)

  doc.setDrawColor(COLOR.orange)
  doc.setLineWidth(1.5)
  doc.line(40, y + 4, 80, y + 4)
}

// ---------- Stat cards (resumen) ----------
function drawStatCard(doc, x, y, w, h, value, label) {
  doc.setFillColor(COLOR.cream)
  doc.setDrawColor(COLOR.border)
  doc.setLineWidth(0.6)
  doc.roundedRect(x, y, w, h, 6, 6, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(COLOR.orange)
  doc.text(String(value), x + w / 2, y + 32, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(COLOR.gray)
  doc.text(label, x + w / 2, y + 50, { align: 'center' })
}

function drawSummaryGrid(doc, startY, pageW, stats) {
  const gridX  = 40
  const gridW  = pageW - 80
  const colW   = (gridW - 20) / 3
  const rowH   = 64
  const items  = [
    ['Total Participantes', stats.total],
    ['Activos',             stats.activos],
    ['Con acceso',          stats.conAcceso],
    ['Por vencer (7 d o menos)', stats.porVencer],
    ['Accesos expirados',   stats.expirados],
    ['Pagos pendientes',    stats.pagosPend],
  ]
  items.forEach(([label, value], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = gridX + col * (colW + 10)
    const y = startY + row * (rowH + 10)
    drawStatCard(doc, x, y, colW, rowH, value, label)
  })
  return startY + Math.ceil(items.length / 3) * (rowH + 10)
}

// ---------- Stats ----------
function calcStats(participants) {
  return {
    total:      participants.length,
    activos:    participants.filter(p => p.status === 'activo').length,
    conAcceso:  participants.filter(p => p.access).length,
    porVencer:  participants.filter(p => p.access && isWarning(p.fecha)).length,
    expirados:  participants.filter(p => isExpired(p.fecha)).length,
    pagosPend:  participants.filter(p => p.payment === 'pendiente').length,
  }
}

// ---------- Tabla por curso ----------
function drawCoursesTable(doc, startY, courses, participants) {
  const rows = courses.map(c => {
    const inscritos = participants.filter(p => p.courses?.includes(c.id)).length
    const cap = c.capacity || 0
    const pct = cap > 0 ? Math.round((inscritos / cap) * 100) + '%' : '—'
    return [
      c.name,
      c.modalidad || '—',
      c.platform  || '—',
      cap > 0 ? `${inscritos} / ${cap}` : String(inscritos),
      pct,
      fmtDateRange(c.start, c.end),
      c.active ? 'Activo' : 'Inactivo',
    ]
  })

  autoTable(doc, {
    startY,
    head: [['Curso', 'Modalidad', 'Plataforma', 'Inscritos', '% Ocup.', 'Fechas', 'Estado']],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica', fontSize: 9, cellPadding: 6,
      textColor: COLOR.black, lineColor: COLOR.border, lineWidth: 0.4,
    },
    headStyles: {
      fillColor: COLOR.black, textColor: COLOR.white,
      fontStyle: 'bold', fontSize: 10, halign: 'left',
    },
    alternateRowStyles: { fillColor: COLOR.cream },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 40, right: 40 },
  })
  return doc.lastAutoTable.finalY
}

// ---------- Tabla por etiqueta ----------
function drawTagsTable(doc, startY, tags, participants) {
  const total = participants.length || 1
  const rows = tags
    .map(t => {
      const n = participants.filter(p => p.tags?.includes(t.id)).length
      return { name: t.name, n, pct: Math.round((n / total) * 100) + '%' }
    })
    .sort((a, b) => b.n - a.n)
    .map(r => [r.name, String(r.n), r.pct])

  autoTable(doc, {
    startY,
    head: [['Etiqueta', 'Participantes', '% del total']],
    body: rows.length ? rows : [['—', '0', '0%']],
    theme: 'grid',
    styles: {
      font: 'helvetica', fontSize: 9, cellPadding: 6,
      textColor: COLOR.black, lineColor: COLOR.border, lineWidth: 0.4,
    },
    headStyles: {
      fillColor: COLOR.black, textColor: COLOR.white,
      fontStyle: 'bold', fontSize: 10, halign: 'left',
    },
    alternateRowStyles: { fillColor: COLOR.cream },
    columnStyles: {
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  })
  return doc.lastAutoTable.finalY
}

// ---------- Tabla lista completa ----------
function drawParticipantsTable(doc, startY, participants, courses) {
  const rows = participants.map(p => {
    const cursos = (p.courses || []).map(id => shortName(id, courses)).join(', ') || '—'
    const diasRest = !p.access ? 'Sin acceso'
      : isExpired(p.fecha) ? 'Expirado'
      : `${daysLeft(p.fecha)} d`
    return [
      p.name,
      p.cedula || '—',
      p.email  || '—',
      p.phone  || '—',
      cursos,
      diasRest,
      p.payment === 'pagado' ? 'Pagado' : 'Pendiente',
      p.status  === 'activo' ? 'Activo' : 'Inactivo',
    ]
  })

  autoTable(doc, {
    startY,
    head: [['Nombre', 'Cédula', 'Correo', 'Teléfono', 'Cursos', 'Días rest.', 'Pago', 'Estado']],
    body: rows.length ? rows : [['Sin participantes', '', '', '', '', '', '', '']],
    theme: 'grid',
    styles: {
      font: 'helvetica', fontSize: 8, cellPadding: 5,
      textColor: COLOR.black, lineColor: COLOR.border, lineWidth: 0.4,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: COLOR.black, textColor: COLOR.white,
      fontStyle: 'bold', fontSize: 9, halign: 'left',
    },
    alternateRowStyles: { fillColor: COLOR.cream },
    columnStyles: {
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center' },
      7: { halign: 'center' },
    },
    margin: { left: 40, right: 40 },
  })
  return doc.lastAutoTable.finalY
}

// ---------- API pública ----------
export function exportReportToPDF({ participants, courses, tags, sections }) {
  const doc   = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  let y = 90  // después del header band

  const startNewPageIfNeeded = (minHeightNeeded) => {
    if (y + minHeightNeeded > pageH - 50) {
      doc.addPage()
      y = 90
    }
  }

  // Sección 1: Resumen
  if (sections.summary) {
    drawSectionTitle(doc, 'Resumen general', y)
    y += 24
    const stats = calcStats(participants)
    y = drawSummaryGrid(doc, y, pageW, stats) + 16
  }

  // Sección 2: Por curso
  if (sections.courses) {
    startNewPageIfNeeded(120)
    drawSectionTitle(doc, 'Desglose por curso', y)
    y += 16
    y = drawCoursesTable(doc, y, courses, participants) + 24
  }

  // Sección 3: Por etiqueta
  if (sections.tagsBreakdown) {
    startNewPageIfNeeded(120)
    drawSectionTitle(doc, 'Desglose por etiqueta', y)
    y += 16
    y = drawTagsTable(doc, y, tags, participants) + 24
  }

  // Sección 4: Lista completa
  if (sections.list) {
    startNewPageIfNeeded(120)
    drawSectionTitle(doc, `Participantes (${participants.length})`, y)
    y += 16
    y = drawParticipantsTable(doc, y, participants, courses) + 16
  }

  // Header + footer en TODAS las páginas (al final, una vez sabido total)
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawHeader(doc, pageW)
    drawFooter(doc, pageW, pageH, i, totalPages)
  }

  doc.save(`reporte-tec-emprende-lab-${todayISO()}.pdf`)
}

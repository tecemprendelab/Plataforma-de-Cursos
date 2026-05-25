// ============================================================
//  export.js — JavaScript
//  Exportación a Excel y CSV con cursos dinámicos.
// ============================================================

import * as XLSX from 'xlsx'
import { daysElapsed, daysLeft, expiryDate, getAccessDays } from './time.js'

function shortName(id, courses) {
  return courses.find(c => c.id === id)?.short || id
}

function buildRows(participants, courses) {
  return participants.map(p => {
    const days = getAccessDays(p, courses)
    return {
      'Nombre':             p.name,
      'Correo':             p.email,
      'Teléfono':           p.phone,
      'Cursos':             p.courses.map(id => shortName(id, courses)).join(', '),
      'Estado':             p.status,
      'Pago':               p.payment,
      'Acceso activo':      p.access ? 'Sí' : 'No',
      'Fecha de ingreso':   p.fecha,
      'Días de acceso':     days,
      'Días transcurridos': daysElapsed(p.fecha),
      'Días restantes':     daysLeft(p.fecha, days),
      'Fecha expiración':   expiryDate(p.fecha, days),
      'Etiquetas':          (p.tags||[]).join(', '),
      'Notas':              p.notes || '',
    }
  })
}

export function exportToExcel(participants, courses, filename='TEC_Emprende_Participantes.xlsx') {
  const ws = XLSX.utils.json_to_sheet(buildRows(participants, courses))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, 'Participantes', ws)
  XLSX.writeFile(wb, filename)
}

export function exportToCSV(participants, courses, filename='TEC_Emprende_Participantes.csv') {
  const rows = buildRows(participants, courses)
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines   = [headers, ...rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g,'""')}"`))].map(r => r.join(','))
  const blob    = new Blob(['\uFEFF' + lines.join('\n')], { type:'text/csv;charset=utf-8' })
  const url     = URL.createObjectURL(blob)
  const a       = Object.assign(document.createElement('a'), { href:url, download:filename })
  a.click()
  URL.revokeObjectURL(url)
}

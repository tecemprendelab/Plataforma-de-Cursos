// ============================================================
//  ExportView.jsx — React JSX
//  Tres cards de exportación:
//    1. Excel (.xlsx)
//    2. CSV
//    3. Reporte PDF (con checkboxes para elegir secciones)
// ============================================================
import { useState } from 'react'
import { daysLeft } from '../utils/time.js'
import { exportToExcel, exportToCSV } from '../utils/export.js'
import { exportReportToPDF }           from '../utils/pdf.js'

const SECTION_LABELS = [
  { key: 'summary',        label: 'Resumen general'                  },
  { key: 'courses',        label: 'Desglose por curso'               },
  { key: 'tagsBreakdown',  label: 'Desglose por etiqueta'            },
  { key: 'list',           label: 'Lista completa de participantes'  },
]

export default function ExportView({ participants, courses, tags = [] }) {
  const shortName = id => courses.find(c => c.id === id)?.short || id

  const [sections, setSections] = useState({
    summary: true, courses: true, tagsBreakdown: true, list: true,
  })
  const toggle = (k) => setSections(s => ({ ...s, [k]: !s[k] }))
  const anyChecked = Object.values(sections).some(Boolean)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h1">Exportar datos</h2>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 3 }}>
            Descargá la lista en el formato que necesitás
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Excel */}
        <div className="card card-padded">
          <i className="ti ti-file-spreadsheet" style={{ fontSize: 32, color: 'var(--green)', marginBottom: 12, display: 'block' }}/>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Exportar a Excel (.xlsx)</div>
          <div className="text-sm text-muted" style={{ marginBottom: 16 }}>
            Incluye todos los campos, días restantes y fechas de expiración.
          </div>
          <button className="btn btn-orange" onClick={() => exportToExcel(participants, courses)}>
            <i className="ti ti-download"/> Descargar Excel ({participants.length})
          </button>
        </div>

        {/* CSV */}
        <div className="card card-padded">
          <i className="ti ti-file-text" style={{ fontSize: 32, color: 'var(--orange)', marginBottom: 12, display: 'block' }}/>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Exportar a CSV</div>
          <div className="text-sm text-muted" style={{ marginBottom: 16 }}>
            Formato universal compatible con cualquier sistema.
          </div>
          <button className="btn btn-black" onClick={() => exportToCSV(participants, courses)}>
            <i className="ti ti-download"/> Descargar CSV ({participants.length})
          </button>
        </div>

        {/* Reporte PDF */}
        <div className="card card-padded">
          <i className="ti ti-report" style={{ fontSize: 32, color: 'var(--black)', marginBottom: 12, display: 'block' }}/>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Reporte PDF</div>
          <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
            Reporte ejecutivo con resumen, cursos, etiquetas y lista detallada.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {SECTION_LABELS.map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={sections[key]} onChange={() => toggle(key)}/>
                {label}
              </label>
            ))}
          </div>

          <button
            className="btn btn-orange"
            disabled={!anyChecked}
            style={!anyChecked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => exportReportToPDF({ participants, courses, tags, sections })}>
            <i className="ti ti-download"/> Generar PDF
          </button>
        </div>
      </div>

      <h3 className="h3" style={{ marginBottom: 12 }}>Vista previa</h3>
      <div className="card">
        <table className="ttable">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Cursos</th><th>Acceso</th><th>Días restantes</th></tr>
          </thead>
          <tbody>
            {participants.slice(0, 8).map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td className="text-sm text-muted">{p.email}</td>
                <td className="text-xs text-muted">{p.courses.map(shortName).join(', ')}</td>
                <td><span className={`badge badge-${p.access ? 'black' : 'gray'}`}>{p.access ? 'Sí' : 'No'}</span></td>
                <td style={{ fontSize: 13 }}>{p.access ? daysLeft(p.fecha) + 'd' : '—'}</td>
              </tr>
            ))}
            {participants.length > 8 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray)', fontSize: 12 }}>
                ... y {participants.length - 8} más
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

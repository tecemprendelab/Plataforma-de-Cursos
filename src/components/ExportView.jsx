// ============================================================
//  ExportView.jsx — React JSX
// ============================================================
import { daysLeft } from '../utils/time.js'

import { exportToExcel, exportToCSV } from '../utils/export.js'

export default function ExportView({ participants, courses }) {
  const shortName = id => courses.find(c => c.id === id)?.short || id
  return (
    <div>
      <div className="page-header"><div><h2 className="h1">Exportar datos</h2><p className="text-muted" style={{fontSize:13,marginTop:3}}>Descargá la lista en el formato que necesitás</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div className="card card-padded">
          <i className="ti ti-file-spreadsheet" style={{fontSize:32,color:'var(--green)',marginBottom:12,display:'block'}}/>
          <div style={{fontWeight:500,fontSize:15,marginBottom:6}}>Exportar a Excel (.xlsx)</div>
          <div className="text-sm text-muted" style={{marginBottom:16}}>Incluye todos los campos, días restantes y fechas de expiración.</div>
          <button className="btn btn-orange" onClick={() => exportToExcel(participants, courses)}>
            <i className="ti ti-download"/> Descargar Excel ({participants.length} registros)
          </button>
        </div>
        <div className="card card-padded">
          <i className="ti ti-file-text" style={{fontSize:32,color:'var(--orange)',marginBottom:12,display:'block'}}/>
          <div style={{fontWeight:500,fontSize:15,marginBottom:6}}>Exportar a CSV</div>
          <div className="text-sm text-muted" style={{marginBottom:16}}>Formato universal compatible con cualquier sistema.</div>
          <button className="btn btn-black" onClick={() => exportToCSV(participants, courses)}>
            <i className="ti ti-download"/> Descargar CSV ({participants.length} registros)
          </button>
        </div>
      </div>
      <h3 className="h3" style={{marginBottom:12}}>Vista previa</h3>
      <div className="card">
        <table className="ttable">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Cursos</th><th>Acceso</th><th>Días restantes</th></tr></thead>
          <tbody>
            {participants.slice(0,8).map(p => (
              <tr key={p.id}>
                <td style={{fontWeight:500}}>{p.name}</td>
                <td className="text-sm text-muted">{p.email}</td>
                <td className="text-xs text-muted">{p.courses.map(shortName).join(', ')}</td>
                <td><span className={`badge badge-${p.access?'black':'gray'}`}>{p.access?'Sí':'No'}</span></td>
                <td style={{fontSize:13}}>{p.access ? daysLeft(p.fecha)+'d' : '—'}</td>
              </tr>
            ))}
            {participants.length > 8 && <tr><td colSpan={5} style={{textAlign:'center',color:'var(--gray)',fontSize:12}}>... y {participants.length-8} más</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

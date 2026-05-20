// ============================================================
//  tags.js — JavaScript
//  Colores disponibles, etiquetas por defecto y helpers.
// ============================================================

export const TAG_COLORS = [
  { id:'orange', bg:'#FEF0E7', border:'#E8651A', text:'#C04E0E', dot:'#E8651A' },
  { id:'black',  bg:'#ECEAE6', border:'#1A1612', text:'#1A1612', dot:'#1A1612' },
  { id:'green',  bg:'#E4F0E8', border:'#3D7A5A', text:'#2A5940', dot:'#3D7A5A' },
  { id:'blue',   bg:'#E6F1FB', border:'#185FA5', text:'#0C447C', dot:'#185FA5' },
  { id:'purple', bg:'#EEEDFE', border:'#534AB7', text:'#3C3489', dot:'#534AB7' },
  { id:'red',    bg:'#FCEBEB', border:'#A32D2D', text:'#791F1F', dot:'#A32D2D' },
  { id:'amber',  bg:'#FAEEDA', border:'#854F0B', text:'#633806', dot:'#BA7517' },
  { id:'teal',   bg:'#E1F5EE', border:'#0F6E56', text:'#085041', dot:'#1D9E75' },
  { id:'pink',   bg:'#FBEAF0', border:'#993556', text:'#72243E', dot:'#D4537E' },
  { id:'gray',   bg:'#F1EFE8', border:'#8A8070', text:'#5F5E5A', dot:'#888780' },
]

export const DEFAULT_TAGS = [
  { id:'t1', name:'Becado',       color:'green'  },
  { id:'t2', name:'Seguimiento',  color:'orange' },
  { id:'t3', name:'Equipo líder', color:'purple' },
  { id:'t4', name:'Empresa',      color:'blue'   },
  { id:'t5', name:'Desertor',     color:'red'    },
  { id:'t6', name:'Certificado',  color:'teal'   },
]

export const TAGS_STORAGE_KEY = 'tec_emprende_tags_v1'

export const getTagColor = (id) =>
  TAG_COLORS.find(c => c.id === id) || TAG_COLORS[0]

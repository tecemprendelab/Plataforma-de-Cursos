// ============================================================
//  constants.js — JavaScript
//  Constantes del sistema. Los cursos ahora son completamente
//  dinámicos y se gestionan desde src/data/courses.js +
//  src/hooks/useCourses.js. Este archivo solo contiene las
//  constantes de reglas de negocio y los participantes demo.
// ============================================================

export const ACCESS_DAYS = 45   // Días de vigencia del acceso
export const WARN_DAYS   = 7    // Días para alerta naranja
export const EXAM_WARN   = 7    // Días antes de expirar para recordatorio
export const STORAGE_KEY = 'tec_emprende_participants_v4'

export const DEFAULT_PARTICIPANTS = [
  { id:'p1', name:'Ana Rodríguez',    email:'ana.rodriguez@gmail.com', phone:'8800-1234', courses:['c1','c2'],     status:'activo',  payment:'pagado',   access:true,  fecha:'2026-04-10', notes:'',                           tags:['t2','t6'] },
  { id:'p2', name:'Carlos Mora',      email:'carlos.mora@outlook.com', phone:'8711-5678', courses:['c3'],          status:'activo',  payment:'pagado',   access:true,  fecha:'2026-04-20', notes:'',                           tags:['t6']      },
  { id:'p3', name:'María Jiménez',    email:'mjimenez@tec.ac.cr',      phone:'8622-9101', courses:['c4'],          status:'activo',  payment:'pendiente',access:false, fecha:'2026-05-01', notes:'Pendiente confirmación pago', tags:['t1']      },
  { id:'p4', name:'Luis Vargas',      email:'lvargas@hotmail.com',     phone:'8533-1122', courses:['c2','c3'],     status:'activo',  payment:'pagado',   access:true,  fecha:'2026-03-25', notes:'',                           tags:['t4','t2'] },
  { id:'p5', name:'Sofía Castro',     email:'sofia.castro@gmail.com',  phone:'8844-3344', courses:['c1'],          status:'inactivo',payment:'pagado',   access:false, fecha:'2025-12-10', notes:'',                           tags:['t5']      },
  { id:'p6', name:'David Ureña',      email:'d.urena@empresa.cr',      phone:'8755-5566', courses:['c4'],          status:'activo',  payment:'pagado',   access:true,  fecha:'2026-05-10', notes:'',                           tags:['t4']      },
  { id:'p7', name:'Valeria Bogantes', email:'vbogantes@gmail.com',     phone:'8666-7788', courses:['c2'],          status:'activo',  payment:'pendiente',access:false, fecha:'2026-05-05', notes:'',                           tags:['t1','t3'] },
  { id:'p8', name:'Andrés Solano',    email:'asolano@tec.ac.cr',       phone:'8877-9900', courses:['c1','c3','c4'],status:'activo',  payment:'pagado',   access:true,  fecha:'2026-05-15', notes:'Equipo líder',                tags:['t3','t6'] },
]

// ============================================================
//  courses.js — JavaScript
//  Cursos y talleres por defecto. Completamente editables
//  desde la UI y persistidos en localStorage via useCourses.
// ============================================================

export const COURSES_STORAGE_KEY = 'tec_emprende_courses_v1'

export const DEFAULT_COURSES = [
  {
    id:         'c1',
    name:       'Diseño Exprés: Aprendé lo básico',
    short:      'Diseño Exprés',
    type:       'curso',
    platform:   'TEC Digital',
    start:      '2026-02-09',
    end:        '2026-03-06',
    capacity:   30,
    price:      '32640',
    modalidad:  'Asincrónico',
    code:       'DISENO2026',
    description: 'Fundamentos de diseño gráfico, teoría del color e identidad visual usando Canva.',
    active:     true,
    accessDays: 45,   // Días de acceso personalizados para este curso
  },
  {
    id:         'c2',
    name:       'Marketing Digital para Emprendimientos',
    short:      'Marketing Digital',
    type:       'curso',
    platform:   'TEC Digital',
    start:      '2026-02-09',
    end:        '2026-03-06',
    capacity:   40,
    price:      '35700',
    modalidad:  'Asincrónico',
    code:       'MKTDIG2026',
    description: 'Estrategias de marketing digital aplicadas a emprendimientos costarricenses.',
    active:     true,
    accessDays: 45,   // Días de acceso personalizados para este curso
  },
  {
    id:         'c3',
    name:       'Taller: Costos 2026',
    short:      'Costos 2026',
    type:       'taller',
    platform:   'TEC Digital',
    start:      '2026-02-09',
    end:        '2026-02-27',
    capacity:   35,
    price:      '22440',
    modalidad:  'Asincrónico',
    code:       'COSTOS2026',
    description: 'Cálculo de costos para productos, servicios y reventa.',
    active:     true,
    accessDays: 45,   // Días de acceso personalizados para este curso
  },
  {
    id:         'c4',
    name:       'Taller de Pre-incubación 2026',
    short:      'Pre-incubación',
    type:       'taller',
    platform:   'Zoom',
    start:      '2026-05-22',
    end:        '2026-07-03',
    capacity:   25,
    price:      '20000',
    modalidad:  'Sincrónico',
    code:       'PREINCUB2026',
    description: 'Proceso de pre-incubación para ideas de negocio innovadoras.',
    active:     true,
    accessDays: 42,   // 6 semanas = 42 días
  },
]

export const COURSE_TYPES    = ['curso', 'taller', 'seminario', 'bootcamp', 'charla']
export const COURSE_PLATFORMS = ['TEC Digital', 'Zoom', 'Teams', 'Presencial', 'Híbrido', 'Otro']
export const COURSE_MODALITIES = ['Asincrónico', 'Sincrónico', 'Híbrido', 'Presencial']

/** Formatea precio en colones con separador de miles */
export function fmtPrice(price) {
  if (!price) return '—'
  return '₡' + Number(price).toLocaleString('es-CR')
}

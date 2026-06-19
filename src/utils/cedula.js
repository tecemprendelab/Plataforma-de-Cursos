// ============================================================
//  cedula.js — Normalización canónica de cédula
//
//  LLAVE UNIVERSAL del ecosistema. Esta misma función debe vivir,
//  idéntica, en todas las plataformas (Diagnóstico, Participantes,
//  Cursos) para que los cruces por cédula calcen siempre.
//
//  Problema que resuelve: la gente omite ceros de los bloques
//  (escriben "1-234-567" en vez de "1-0234-0567"). Rellenar a la
//  izquierda del número completo fallaría; hay que rellenar bloque
//  por bloque cuando hay separadores, y dejar Hacienda/TSE como
//  árbitro para los casos ambiguos sin separadores.
//
//  Formato canónico (física nacional): 9 dígitos sin separadores
//  = provincia(1) + tomo(4) + asiento(4).
// ============================================================

/**
 * Devuelve la forma canónica de una cédula para usar como llave de cruce.
 * - Física nacional: 9 dígitos, ceros rellenados por bloque.
 * - DIMEX / jurídica (más de 9 dígitos): se deja solo-dígitos sin rellenar.
 * - Entrada vacía o inválida: cadena vacía.
 */
export function normalizeCedula(raw) {
  if (!raw) return ''
  const limpio = String(raw).trim()
  if (!limpio) return ''

  // Caso ideal: viene segmentada con guiones/espacios/puntos → "1-234-567"
  const partes = limpio.split(/[-\s.]+/).filter(Boolean)
  if (partes.length === 3 && partes.every(p => /^\d+$/.test(p))) {
    const [prov, tomo, asiento] = partes
    if (prov.length <= 1 && tomo.length <= 4 && asiento.length <= 4) {
      return prov.padStart(1, '0') + tomo.padStart(4, '0') + asiento.padStart(4, '0')
    }
  }

  // Sin separadores claros: trabajar con solo-dígitos
  const d = limpio.replace(/\D/g, '')
  if (!d) return ''
  if (d.length === 9) return d            // ya completa
  if (d.length < 9) return d.padStart(9, '0') // mejor esfuerzo (ambiguo: validar con TSE)
  return d                                 // DIMEX / jurídica: no se rellena
}

/** Compara dos cédulas por su forma canónica. */
export function cedulasMatch(a, b) {
  const na = normalizeCedula(a)
  return na !== '' && na === normalizeCedula(b)
}

/**
 * Formato legible con guiones a partir de la canónica de 9 dígitos.
 * Si no es física de 9 dígitos, devuelve el valor tal cual.
 */
export function formatCedula(raw) {
  const c = normalizeCedula(raw)
  if (c.length !== 9) return c
  return `${c[0]}-${c.slice(1, 5)}-${c.slice(5)}`
}

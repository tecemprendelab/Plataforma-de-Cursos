// ============================================================
//  async.js — Utilidades asíncronas.
// ============================================================

/**
 * Procesa `items` ejecutando `fn` en paralelo, pero con un límite de
 * concurrencia (`limit` workers a la vez). Preserva el orden en el
 * array de resultados. Útil para no saturar una API pública al
 * consultar muchos registros.
 *
 * @param {Array}    items  Elementos a procesar
 * @param {number}   limit  Máximo de tareas concurrentes
 * @param {Function} fn     async (item, index) => result
 * @returns {Promise<Array>} resultados en el mismo orden que items
 */
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
  return results
}

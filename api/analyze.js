// ============================================================
//  api/analyze.js — Vercel Serverless Function
//  Recibe una imagen en base64 y usa GPT-4o para extraer
//  datos de participantes de formularios de matrícula.
//
//  Vercel detecta automáticamente /api/*.js como funciones.
//  Variable de entorno requerida: OPENAI_API_KEY
//  (configurar en Vercel Dashboard → Settings → Environment Variables)
// ============================================================

export default async function handler(req, res) {
  // CORS para llamadas desde el frontend
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  const { base64, mimeType } = req.body

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'Se requieren base64 y mimeType' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en Vercel' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model:      'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role:    'user',
          content: [
            {
              type:      'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `Analizá esta imagen de un formulario de matrícula de TEC Emprende Lab.
Extraé los datos de los participantes que aparecen.
Respondé ÚNICAMENTE con JSON válido, sin texto adicional, sin backticks, sin markdown:
{"participants":[{"name":"nombre completo","email":"correo@ejemplo.com","phone":"número de teléfono","courses":["nombre exacto del curso"],"notes":"observaciones si hay"}]}
Si no encontrás algún campo dejalo como cadena vacía "".
Si hay varios participantes incluilos todos en el array.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenAI error:', err)
      return res.status(502).json({ error: 'Error al consultar OpenAI', detail: err })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || '{}'

    // Devolvemos en el mismo formato que espera ImportView.jsx
    return res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (err) {
    console.error('analyze.js error:', err)
    return res.status(500).json({ content: [{ type: 'text', text: '{}' }] })
  }
}

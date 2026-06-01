# CLAUDE.md — TEC Emprende Lab · Plataforma de Cursos

Reglas para cada tarea. Sesgo: cautela sobre velocidad en trabajo no trivial. Juicio libre en tareas triviales.

---

## Contexto del proyecto

- **Stack**: React 18 + Vite 5 (SPA), Vercel Serverless Functions (`api/*.js`), futuro Supabase (DB/Auth).
- **Hosting**: Vercel. `vercel.json` rutea `/api/*` a serverless y todo lo demás a `index.html`.
- **Persistencia actual**: `localStorage` vía hooks (`useParticipants`, `useCourses`, `useTags`). Migración a Supabase pendiente.
- **IA**: `api/analyze.js` usa GPT-4o para extraer participantes desde imagen (requiere `OPENAI_API_KEY`).
- **Dominio**: gestión de acceso (45 días por defecto, ver `ACCESS_DAYS` en `src/data/constants.js`) a cursos virtuales del TEC Emprende Lab.
- **Idioma**: UI, comentarios y commits en español. Identificadores en código en inglés.
- **Paleta** (2do semestre): arena `#FAF5EC`, naranja `#E8521A`, siena `#A84020`, oliva `#6E7530`, lavanda `#8098C8`, negro `#1A1612`. Fuente Poppins.

---

## Reglas

### 1 — Piensa antes de codear
Declara suposiciones. Pregunta antes de adivinar. Presenta interpretaciones múltiples cuando hay ambigüedad. Detente cuando estés confundido y nombra qué no está claro.

### 2 — Simplicidad primero
Código mínimo que resuelve. Nada especulativo. Sin features no pedidos. Sin abstracciones para uso único. Si un senior diría "sobrecomplicado", simplifica.

### 3 — Cambios quirúrgicos
Toca solo lo necesario. No "mejores" código adyacente, comentarios ni formato. No refactorices lo que no está roto. Respeta el estilo existente del archivo.

### 4 — Ejecución por objetivos
Define criterios de éxito antes de empezar. Itera hasta verificar. No sigas pasos ciegamente — define qué es éxito y converge.

### 5 — Modelo solo para juicio
Usa LLM (GPT-4o en `api/analyze.js`, etc.) para: clasificación, extracción de texto no estructurado, resumen.
NO uses LLM para: ruteo, reintentos, parseo determinístico, validación de formatos, fechas, cálculos.
Si el código puede responder, el código responde.

### 6 — Presupuestos de tokens
Tarea: 4,000 tokens. Sesión: 30,000. Si te acercas, resume y reinicia. Surfacea el exceso.

### 7 — Surfacea conflictos, no los promedies
Si dos patrones existentes contradicen (ej. dos formas de manejar fechas), elige uno —el más reciente/probado— y marca el otro para limpieza. No mezcles.

### 8 — Lee antes de escribir
Antes de tocar un archivo, lee sus exports, su caller inmediato y utilidades compartidas (`src/utils/*`, `src/data/*`). Si no entiendes la estructura, pregunta. "Parece ortogonal" es la frase más peligrosa.

### 9 — Tests verifican intención
Si agregás tests: cada uno codifica POR QUÉ importa el comportamiento, no solo QUÉ hace. Hardcodeos derrotan el test. Si no podés escribir un test que falle cuando la regla de negocio cambia, la función está mal modelada.

### 10 — Checkpoint tras cada paso
En tareas multi-paso: resume qué se hizo, qué está verificado, qué falta. No continúes desde un estado que no podés describir. Si perdés el hilo, detente y replantea.

### 11 — Respeta convenciones
- Imports con alias `@/` (configurado en `vite.config.js`).
- Hooks funcionales, no clases.
- Strings en español para UI, inglés para nombres internos.
- Estilos en `src/styles/global.css` con variables CSS, no styled-components ni Tailwind (todavía).
- Componentes en PascalCase, hooks `useXxx`, utilidades camelCase.
Si una convención te parece dañina, súbela como conversación. No la forks en silencio.

### 12 — Falla en voz alta
Si no podés garantizar que algo funcionó, decilo. "Build OK" está mal si saltaste el typecheck. "Migración OK" está mal si 30 registros se saltaron. Por default: surfacear incertidumbre.

---

## Reglas específicas del proyecto

### Datos sensibles
- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc. **nunca** al repo. `.env` es plantilla; secretos van en `.env.local` (ignorado) y en Vercel → Environment Variables.
- `api/analyze.js` corre server-side: la API key vive en el entorno de Vercel, no en el cliente.

### Migración a Supabase (pendiente)
- Estado actual: persistencia 100% en `localStorage` dentro de los hooks.
- Al migrar: mantené la API pública de los hooks (`addParticipant`, `updateCourse`, etc.) para no tocar componentes. Reemplaza solo la implementación interna.
- RLS obligatorio en todas las tablas. Auth por correo (admin del TEC Emprende Lab).

### Lógica de acceso
- `src/utils/time.js` es la **única** fuente de verdad para cálculos de fecha y estado de acceso. No dupliques esa lógica en componentes.
- `ACCESS_DAYS` se lee de `src/data/constants.js`. No lo hardcodees.

### Antes de marcar tarea completa
- `npm run build` debe pasar.
- Si tocaste `api/*.js`, probá con `vercel dev` localmente.
- Si tocaste UI, abrí el browser y verificá el camino feliz + un edge case.
- Si tocaste persistencia, verificá que datos viejos en `localStorage` no rompen el render.

### Commits y PRs
- Mensajes en español, formato Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- Un commit por cambio lógico, no megacommits.
- Push directo a `main` solo para fixes triviales; features → branch + PR.

# TEC Emprende Lab — Gestión de Participantes

Sistema de control de acceso y seguimiento de participantes para los cursos virtuales de TEC Emprende Lab.

---

## Stack tecnológico

| Archivo | Lenguaje | Responsabilidad |
|---|---|---|
| `src/data/constants.js`  | JavaScript | Constantes de negocio (ACCESS_DAYS, etc.) y participantes demo |
| `src/data/courses.js`    | JavaScript | Cursos por defecto, tipos, plataformas y helper fmtPrice |
| `src/data/tags.js`       | JavaScript | Colores y etiquetas por defecto |
| `src/utils/time.js`      | JavaScript | Lógica de fechas y acceso (pura, sin React) |
| `src/utils/email.js`     | JavaScript | Construcción de correos recordatorio |
| `src/utils/export.js`    | JavaScript | Exportación a Excel y CSV |
| `src/hooks/useParticipants.js` | JS React Hook | Estado global y CRUD de participantes |
| `src/hooks/useCourses.js`| JS React Hook | Estado global y CRUD de cursos |
| `src/hooks/useTags.js`   | JS React Hook | Estado global y CRUD de etiquetas |
| `src/styles/global.css`  | CSS | Variables de diseño, Poppins, paleta crema/naranja/negro |
| `src/components/`        | React JSX | Todos los componentes de UI |
| `src/App.jsx`            | React JSX | Router y orquestador principal |
| `api/analyze.js`         | JavaScript | Serverless function (Vercel) — análisis de imágenes con GPT-4o |
| `vercel.json`            | JSON | Configuración de rutas y headers para Vercel |

---

## Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de variables de entorno
cp .env .env.local
# Editar .env.local y poner tu OPENAI_API_KEY

# 3. Correr en desarrollo
npm run dev
# → http://localhost:5173

# 4. Build para producción
npm run build
```

---

## Deploy en Vercel

### Opción A — desde GitHub (recomendada)
1. Subí el proyecto a un repositorio GitHub
2. Entrá a [vercel.com](https://vercel.com) → **Add New Project**
3. Importá tu repositorio
4. En **Environment Variables** agregá:
   - `OPENAI_API_KEY` = tu clave de OpenAI
5. Hacé clic en **Deploy**

### Opción B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
# Seguí las instrucciones. Agregá OPENAI_API_KEY cuando te lo pida.
```

> La función `/api/analyze` se detecta automáticamente como Serverless Function de Vercel. No requiere configuración extra.

---

## Funcionalidades

- ✅ CRUD completo de participantes con etiquetas libres
- ✅ CRUD completo de cursos y talleres (dinámicos)
- ✅ Barra de progreso de 45 días por participante
- ✅ Revocación automática de acceso al expirar
- ✅ Alertas: expirados (rojo), por vencer (naranja)
- ✅ Recordatorios de prueba final con correo prellenado
- ✅ Filtros avanzados: curso, estado, etiqueta, ordenamiento
- ✅ Vista de perfil individual
- ✅ Importar participantes desde imagen con IA (GPT-4o)
- ✅ Exportar a Excel (.xlsx) y CSV
- ✅ Persistencia en localStorage
- ✅ Deploy en Vercel (SPA + Serverless API)

---

## Paleta y tipografía

```css
--font-body:    "Poppins", sans-serif;   /* cuerpo: 400/500 */
--font-display: "Poppins", sans-serif;   /* títulos: 600 */
--cream:  #FAF6EE   /* Fondo */
--orange: #E8651A   /* Primario */
--black:  #1A1612   /* Sidebar */
--gray:   #8A8070   /* Secundario */
```

---

Contacto: tecemprendelab@itcr.ac.cr · 2550-9270

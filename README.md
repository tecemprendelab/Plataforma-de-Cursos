# TEC Emprende Lab — Gestión de Participantes

Sistema de control de acceso y seguimiento de participantes para los cursos virtuales de TEC Emprende Lab.

App en producción: <https://plataforma-de-cursos-zeta.vercel.app>

---

## Stack tecnológico

| Archivo | Lenguaje | Responsabilidad |
|---|---|---|
| `src/data/constants.js`        | JavaScript    | Constantes de negocio (`ACCESS_DAYS`, etc.) y demo legacy |
| `src/data/courses.js`          | JavaScript    | Cursos demo legacy + tipos / plataformas / helper `fmtPrice` |
| `src/data/tags.js`             | JavaScript    | Colores y etiquetas demo legacy |
| `src/utils/time.js`            | JavaScript    | Fechas y acceso (puro, sin React) |
| `src/utils/email.js`           | JavaScript    | Construcción de correos recordatorio |
| `src/utils/export.js`          | JavaScript    | Exportación a Excel y CSV |
| `src/hooks/useParticipants.js` | JS React Hook | CRUD de participantes (Supabase + fallback localStorage) |
| `src/hooks/useCourses.js`      | JS React Hook | CRUD de cursos |
| `src/hooks/useTags.js`         | JS React Hook | CRUD de etiquetas |
| `src/hooks/useAuth.js`         | JS React Hook | Sesión Supabase Auth |
| `src/lib/supabase.js`          | JavaScript    | Cliente Supabase singleton + retry de JWT skew |
| `src/lib/database.types.ts`    | TypeScript    | Tipos generados desde el schema (referencia) |
| `src/styles/global.css`        | CSS           | Variables de diseño, Poppins, paleta crema/naranja/negro |
| `src/components/`              | React JSX     | Componentes de UI |
| `src/App.jsx`                  | React JSX     | Router + guard de sesión |
| `supabase/migrations/`         | SQL           | Schema versionado (4 migraciones) |
| `supabase/seed.sql`            | SQL           | Datos demo iniciales |
| `vercel.json`                  | JSON          | Configuración de rutas para Vercel |

---

## Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local
# Las claves de Supabase ya vienen llenas (anon key pública).

# 3. Correr en desarrollo
npm run dev
# → http://localhost:5173
```

---

## Deploy

Auto-deploy en cada push a `main` (Vercel + GitHub).

Variables de entorno en Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(en Production + Preview + Development)

---

## Funcionalidades

- CRUD de participantes con etiquetas libres + cursos N:N
- CRUD de cursos y talleres
- Barra de progreso de 45 días, alertas de expiración
- Recordatorios de prueba final con correo prellenado
- Filtros: curso, estado, etiqueta, ordenamiento
- **Importar CSV** de matrícula con detección de duplicados por email/cédula
- Exportar a Excel (`.xlsx`) y CSV
- Auth Supabase (admin único)
- Persistencia en Supabase Postgres con RLS

---

## Paleta y tipografía

```css
--font-display: "Poppins", sans-serif;   /* títulos: 600 */
--font-body:    "Poppins", sans-serif;   /* cuerpo: 400/500 */
--cream:  #FAF6EE   /* Fondo */
--orange: #E8651A   /* Primario */
--black:  #1A1612   /* Sidebar */
--gray:   #8A8070   /* Secundario */
```

---

Contacto: tecemprendelab@itcr.ac.cr · 2550-9270

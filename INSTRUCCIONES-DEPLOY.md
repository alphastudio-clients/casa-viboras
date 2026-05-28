# La Casa de Víboras — Instrucciones de Deploy

## PASO 1: Crear proyecto Supabase

1. Ir a https://supabase.com/dashboard y crear un nuevo proyecto
2. Elegir región (recomendado: South America São Paulo)
3. Guardar la contraseña de la base de datos

## PASO 2: Ejecutar SQL en Supabase

Ir a **SQL Editor** en tu proyecto de Supabase y ejecutar en orden:

```
1. supabase/schema.sql
2. supabase/rls-policies.sql
3. supabase/seed.sql   (opcional — carga datos demo)
```

## PASO 3: Configurar Auth en Supabase

### Google OAuth (método recomendado)

1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto (o usar uno existente)
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized redirect URIs: `https://[tu-proyecto].supabase.co/auth/v1/callback`
6. Copiar Client ID y Client Secret

En Supabase → **Authentication → Providers → Google**:
- Activar Google
- Pegar Client ID y Client Secret
- Guardar

### Instagram OAuth (opcional, requiere Meta Developer App)

Instagram Login requiere una app en https://developers.facebook.com con:
- Product: "Instagram Basic Display" o "Facebook Login"
- Valid OAuth Redirect URIs: `https://[tu-proyecto].supabase.co/auth/v1/callback`
- App Review aprobado por Meta (puede demorar días)

**Por ahora está desactivado en la UI.** Cuando tengas la app de Meta aprobada,
en Supabase → Authentication → Providers → Instagram podés configurarlo igual que Google.

## PASO 4: Configurar Storage (fotos de jugadoras)

1. Supabase → Storage → Create bucket
2. Name: `jugadores`
3. Public: **SÍ** (para que las fotos sean accesibles)
4. Agregar policy: INSERT para authenticated, SELECT para todos

## PASO 5: Variables de entorno

Copiar `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Rellenar con los valores de tu proyecto Supabase:
- URL: Settings → API → Project URL
- ANON_KEY: Settings → API → anon public
- SERVICE_ROLE_KEY: Settings → API → service_role (¡mantener secreto!)
- ADMIN_EMAILS: tu email (separados por coma si hay varios)
- NEXT_PUBLIC_SITE_URL: http://localhost:3000 (dev) o tu dominio en prod

## PASO 6: Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## PASO 7: Configurarte como admin

1. Entrar a http://localhost:3000/login
2. Loguearte con Google (tu email del paso ADMIN_EMAILS)
3. En Supabase → SQL Editor ejecutar:

```sql
INSERT INTO public.admin_users (email, notes)
VALUES ('tu@email.com', 'Admin principal');

-- También actualizar tu rol en profiles:
UPDATE public.profiles SET role = 'admin'
WHERE email = 'tu@email.com';
```

4. Ahora podés entrar a http://localhost:3000/admin

## PASO 8: Deploy en Vercel

```bash
npm install -g vercel
vercel login
vercel
```

O directamente en vercel.com:
1. Importar repositorio de GitHub
2. En **Environment Variables**, agregar todas las variables de `.env.local`
3. Cambiar `NEXT_PUBLIC_SITE_URL` a tu dominio de Vercel
4. Deploy

### Actualizar Supabase para producción

En Supabase → Authentication → URL Configuration:
- Site URL: `https://tu-app.vercel.app`
- Redirect URLs: `https://tu-app.vercel.app/**`

En Google Cloud Console → OAuth Client:
- Agregar `https://[supabase-project].supabase.co/auth/v1/callback` (ya debe estar)

---

## Agregar jugadoras con foto

1. Ir a `/admin/jugadores`
2. Crear la jugadora
3. En Supabase → Storage → jugadores → Upload: subir la foto
4. Copiar la URL pública de la foto
5. En Supabase → Table Editor → players → editar la jugadora → `photo_url` = la URL

---

## Flujo de una votación

1. Admin → /admin/votaciones → "Nueva votación" → tipo, título, quién puede votar
2. Cuando quieras abrirla: clic en ▶ (Play)
3. El público puede votar en /votar
4. Cuando quieras cerrarla: clic en ■ (Stop)
5. Ver resultados en /admin/resultados (solo el admin los ve)
6. Elegir ganadora (o publicar top 1 automáticamente)
7. Clic en 👁 Publicar → aparece la pantalla de reveal en /resultado/[id]

---

## Estructura de archivos clave

```
src/
├── app/
│   ├── page.tsx                    ← Intro animation
│   ├── casa/page.tsx               ← Home con jugadoras
│   ├── jugadores/                  ← Lista + perfil
│   ├── votar/                      ← Votaciones públicas
│   ├── resultado/                  ← Resultados publicados
│   ├── admin/                      ← Panel admin (protegido)
│   ├── auth/callback/route.ts      ← OAuth callback
│   ├── auth/signout/route.ts       ← Logout
│   └── actions/
│       ├── votes.ts                ← Server action votar
│       └── admin.ts                ← Server actions admin
├── components/
│   ├── animations/                 ← Intro, Reveal
│   ├── layout/Header.tsx
│   ├── players/PlayerCard.tsx
│   ├── voting/VoteForm.tsx
│   └── admin/                      ← Todos los paneles admin
├── lib/
│   ├── supabase/client.ts          ← Browser client
│   ├── supabase/server.ts          ← Server + Admin client
│   └── auth/utils.ts               ← requireAdmin, getProfile, etc.
└── types/index.ts                  ← Todos los tipos TypeScript
supabase/
├── schema.sql                      ← Crear tablas
├── rls-policies.sql                ← Seguridad RLS
└── seed.sql                        ← Datos demo
```

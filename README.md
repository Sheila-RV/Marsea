# Gym Management

MVP multi-gimnasio para gestionar disciplinas, planes, miembros, clases y asistencia. Una sola plataforma donde cada gimnasio (tenant) tiene sus propios administradores, alumnos y horarios, pensada para hacer demos a varios gimnasios.

Este repo también nació como un proyecto de aprendizaje de NestJS y Next.js. El backend completo y los dos frontends ya están construidos y probados. El recorrido pedagógico de las primeras lecciones sigue documentado en [docs/ROADMAP.md](docs/ROADMAP.md) y [docs/lessons/](docs/lessons/).

## Qué hace

- **Super admin** (dueña de la plataforma): crea gimnasios y su primer administrador, desde `apps/admin`.
- **Admin de gimnasio**: gestiona disciplinas, planes, usuarios, membresías y clases, y marca asistencia, desde `apps/admin`.
- **Miembro**: ve solo las clases de las disciplinas que cubre su plan, reserva, cancela y tiene su propio código QR, desde `apps/web`.
- **Check-in por QR**: el staff escanea el QR personal de un miembro y el sistema marca sola la asistencia a la clase que le corresponde en ese momento.

Regla central: si un miembro tiene el plan "Solo Spinning", solo ve clases de spinning.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma 7 |
| Base de datos | PostgreSQL en Neon |
| Auth | JWT propio (Passport), roles `SUPER_ADMIN` / `ADMIN` / `MEMBER`, aislamiento por `gymId` |
| Documentación de API | Swagger en `/api/docs` |
| Frontend miembros (`apps/web`) | Next.js 16 (App Router), Tailwind, shadcn/ui, TanStack Query |
| Frontend staff (`apps/admin`) | Next.js 16 (App Router), Tailwind, shadcn/ui, TanStack Query |
| Hosting | API en Render, ambos frontends en Vercel, DNS en Cloudflare — pendiente de desplegar |

Dos frontends independientes, no una sola app con rutas por rol: más simple de mantener y cada uno se despliega a su propio dominio (`app.tugimnasio.com` para miembros, `staff.tugimnasio.com` para el equipo).

## Estructura

```
apps/
  api/      # NestJS — backend completo
  web/      # Next.js — frontend de miembros (puerto 3001)
  admin/    # Next.js — frontend de staff y super admin (puerto 3002)
docs/
  ROADMAP.md
  lessons/  # guías de las lecciones L00-L07
```

## Cómo correr en local

Necesitas los tres corriendo a la vez (API + los dos frontends).

### API

```bash
cd apps/api
npm install
npm run start:dev
```

La API queda en `http://localhost:3000/api`, con documentación interactiva en `http://localhost:3000/api/docs`.

Variables de entorno: copia `apps/api/.env.example` a `apps/api/.env` y completa `DATABASE_URL` (Neon) y `JWT_SECRET` (una cadena aleatoria de al menos 32 caracteres). `CORS_ORIGIN` ya trae por defecto los dos puertos de los frontends locales.

Para dejar datos de demo (dos gimnasios completos, admins, miembros, disciplinas, planes, clases y una reserva):

```bash
npx prisma db seed
```

### Web (miembros)

```bash
cd apps/web
npm install
npm run dev
```

Queda en `http://localhost:3001`. Copia `apps/web/.env.example` a `apps/web/.env.local` si necesitas apuntar a otra URL de API.

### Admin (staff y super admin)

```bash
cd apps/admin
npm install
npm run dev
```

Queda en `http://localhost:3002`. Copia `apps/admin/.env.example` a `apps/admin/.env.local` si necesitas apuntar a otra URL de API.

## Credenciales de demo

Las crea `prisma/seed.ts`. Solo para desarrollo local, nunca usar en producción.

| Rol | Gimnasio | Email | Contraseña | App |
|---|---|---|---|---|
| SUPER_ADMIN | — (plataforma) | `super@gym-management.dev` | `SuperAdmin123!` | admin |
| ADMIN | Iron Gym | `admin@iron-gym.dev` | `IronAdmin123!` | admin |
| MEMBER (plan "Solo Spinning") | Iron Gym | `member@iron-gym.dev` | `Member123!` | web |
| ADMIN | Flex Studio | `admin@flex-studio.dev` | `FlexAdmin123!` | admin |
| MEMBER (plan con todas las disciplinas) | Flex Studio | `member@flex-studio.dev` | `Member123!` | web |

El miembro de Iron Gym es el caso de demo del proyecto: con el plan "Solo Spinning" solo ve clases de Spinning en la pantalla de clases disponibles, aunque Iron Gym también ofrezca Yoga y Funcional.

## Tests

```bash
cd apps/api
npm run test       # unitarios (reglas de negocio de bookings y disciplines)
npm run test:e2e   # end-to-end contra la base de datos real (requiere el seed corrido)
```

Los frontends no tienen tests automatizados todavía; se verifican con `npm run build` (type-check + lint incluidos) en cada uno.

## Convenciones

- Interfaz en español, código en inglés.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- Alcance en el commit cuando aplica: `feat(api): ...`, `feat(web): ...`, `feat(admin): ...`.

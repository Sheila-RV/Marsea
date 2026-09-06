# Gym Management

MVP multi-gimnasio para gestionar disciplinas, planes, miembros, clases y asistencia. Una sola aplicación donde cada gimnasio (tenant) tiene sus propios administradores, alumnos y horarios, pensada para hacer demos a varios gimnasios.

Este repo también es un proyecto de aprendizaje: backend con NestJS y frontend con Next.js, construidos desde cero con buenas prácticas. El recorrido completo está en [docs/ROADMAP.md](docs/ROADMAP.md) y cada lección en [docs/lessons/](docs/lessons/).

## Qué hace

- **Super admin** (dueña de la plataforma): crea gimnasios y su primer administrador.
- **Admin de gimnasio**: gestiona disciplinas, planes, usuarios, membresías, clases y marca asistencia.
- **Miembro**: ve solo las clases de las disciplinas que cubre su plan, reserva y cancela.

Regla central: si un miembro tiene el plan "Solo Spinning", solo ve clases de spinning.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma 7 |
| Base de datos | PostgreSQL en Neon |
| Auth | JWT propio, roles `SUPER_ADMIN` / `ADMIN` / `MEMBER` |
| Frontend | Next.js 16 (App Router), Tailwind, shadcn/ui, TanStack Query |
| Hosting | API en Render, web en Vercel, DNS en Cloudflare |

## Estructura

```
apps/
  api/      # NestJS
  web/      # Next.js
docs/
  ROADMAP.md
  lessons/  # guías de cada lección
```

## Cómo correr en local

Se completa a medida que avanzan las lecciones.

### API

```bash
cd apps/api
npm install
npm run start:dev
```

### Web

```bash
cd apps/web
npm install
npm run dev
```

## Credenciales de demo

Se documentan cuando exista el seed (lección 12).

## Convenciones

- Interfaz en español, código en inglés.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- Alcance en el commit cuando aplica: `feat(api): ...`, `feat(web): ...`.

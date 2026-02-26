# Rekkomo

Community platform for Indian migrants to find trusted local networks.

## Tech
- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- NextAuth (Credentials + Google, JWT sessions)
- TailwindCSS

## Environment variables
```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
Generate a strong `NEXTAUTH_SECRET` (example):
```
openssl rand -base64 32
```

## Local development
1. Install deps
2. Run migrations
3. Seed data
4. Start dev server

```
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Deployment notes
- Works on Vercel/Fly/Render with managed Postgres
- Ensure all env vars are set in the hosting provider
- Run `prisma migrate deploy` during release

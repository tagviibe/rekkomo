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
- Ensure all env vars are set
- Run `prisma migrate deploy` during release

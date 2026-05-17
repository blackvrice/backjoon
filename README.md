# Backjoon DB Pages Complete

관리자 화면을 샘플 배열 방식에서 PostgreSQL + Prisma API 방식으로 변경한 완성본입니다.

## 포함 파일

- `src/app/admin/page.tsx`
- `src/app/admin/problems/page.tsx`
- `src/app/admin/submissions/page.tsx`
- `src/app/admin/logs/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/api/admin/summary/route.ts`
- `src/app/api/admin/problems/route.ts`
- `src/app/api/admin/submissions/route.ts`
- `src/app/api/admin/logs/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/lib/prisma.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma.config.ts`
- `docker-compose.yml`
- `.env.example`

## 필요한 패키지

```bash
npm i @prisma/adapter-pg pg dotenv
npm i -D prisma
```

## 실행 순서

```bash
copy .env.example .env

docker compose up -d

npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed

npm run dev:all
```

## 주의

기존 `prisma/schema.prisma`가 있다면 덮어쓰기 전에 백업하세요.
`judgeWorker.ts`가 참조하는 `Problem`, `TestCase`, `Submission` 필드는 유지되어 있습니다.

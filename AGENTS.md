# SyncData Queue - Agent Instructions

## Dev Commands
```bash
cd backend
npm run dev    # Start with tsx watch (src/index.ts)
npm run build  # Compile TypeScript to dist/
```

## Architecture
- **Backend**: Express + TypeScript (CommonJS)
- **Queue**: BullMQ + Redis for async Excel processing
- **DB**: PostgreSQL with Prisma (uses `PrismaPg` adapter for native connection - critical for `createMany` performance)
- **Validation**: Zod schema with CSV injection mitigation (`sanitizeCsvInjection`)

## Infrastructure
- **Docker Compose**: PostgreSQL (5432) + Redis (6379) - both bound to 127.0.0.1
- **Required env vars**: `DATABASE_URL`, `PORT` (default 4000)
- Run `docker-compose up` before starting backend

## DB Models
- `Product` - Valid products (sku unique)
- `QuarantineRecord` - Invalid rows with error messages

## Important Quirks
- Uses `PrismaPg` adapter instead of standard PrismaClient (faster bulk inserts)
- `skipDuplicates: true` on product insert (ignores duplicate SKUs)
- Worker simulates 10s processing delay (line 20 of excelWorker.ts)
- Excel date handling: ensure dates are cast properly from Excel serial format
- If I type "make" at the end of the prompt, then you can perform actions on the code; otherwise, you cannot.
- If I type "ask" at the end of the prompt, I am only asking you a question, and you should NOT make ANY CHANGES.
# Techkraft — Merchant Payments Portal

Angular 20 merchant application portal: RBAC, config-driven reactive forms, MSW mock API, Vitest unit tests.

## For evaluators and reviewers

**For evaluators and reviewers**

**Read one document:** **[docs/EVALUATOR-GUIDE.md](docs/EVALUATOR-GUIDE.md)** — start with **Must-needed implementations (checklist)** for pass/fail against the repo.

## Quick start

```bash
npm install
npm start          # http://localhost:4200
npm test           # 33 spec files, 59 tests
npm run build
```

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| SALES    | `sales@merchant.test`    | `password` |
| REVIEWER | `reviewer@merchant.test` | `password` |
| ADMIN    | `admin@merchant.test`    | `password` |

## Repository layout

```
src/app/     core, features, layout, shared (standalone Angular)
src/mocks/   MSW handlers (dev)
src/styles/  Sass layers
docs/        EVALUATOR-GUIDE.md (complete documentation)
```

Documentation lives in **`README.md`** (quick start) and **`docs/EVALUATOR-GUIDE.md`** (full review guide).

## Verify

```bash
npm run build
npm test
```

**AI assistance disclosure:** Built with Cursor; behavior verified with build and tests. See evaluator guide for design rationale.

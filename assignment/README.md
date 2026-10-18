# Unit Testing Assignment — Election App (Authentication)

Assignment section 2, applied to **one feature of the Online Election System**: the
**Authentication** flow (the files assigned to this workstream:
`src/controllers/auth.controller.ts`, `src/services/auth.service.ts`,
`src/routes/auth.routes.ts`, `src/repositories/user.repository.ts`).

Everything for the assignment lives under `assignment/` (plus the runner config
`vitest.config.mts`); the production code is untouched. Written to the CMU CAMT
*Software Testing in Real Industry* conventions (AAA, test doubles, builders + seeded
faker) using the same runner as the workshop reference — **Vitest 5**.

## Contents

| Part | Deliverable | File |
| --- | --- | --- |
| **2.1** Unit Test Design | Feature, units, test-case table, rationale | [`UNIT-TEST-DESIGN.md`](./UNIT-TEST-DESIGN.md) |
| **2.2** Code Comparison (bonus) | Original vs. post-V&V, with branch + diff commands | [`CODE-COMPARISON.md`](./CODE-COMPARISON.md) |
| **2.3** Unit Test Implementation | The 6 test cases | [`auth.service.test.ts`](./auth.service.test.ts), [`auth.controller.test.ts`](./auth.controller.test.ts) |

## The six required test cases (§2.3)

| ID | Requirement | Test | Double |
| --- | --- | --- | --- |
| `UT-01` | 2.3.1 Success (happy path) | Register a new voter in an existing constituency | mock repo modules |
| `UT-02` | 2.3.2 Alternative / failure | Duplicate national id → rejected, nothing created | stub `findByNationalId` |
| `UT-03` | 2.3.3 **Stub** | Canned constituency (`id 42`) flows into `create` | stub |
| `UT-04` | 2.3.4 **Spy** | `vi.spyOn(jwt, 'sign')` records the signed token claims | spy |
| `UT-05` | 2.3.5 **Mock** | `user.repository` asked exactly once with the national id | mock |
| `UT-06` | 2.3.6 **Faker** | Random (seeded) 13-digit id + laser code logs in | — |

## Run it (one command)

```bash
npm test
```

Expected output: **6 passed**.

## Course conventions applied

- **AAA** — each test is Arrange / Act / Assert, one behaviour, no logic (Lab 02).
- **Test doubles** — dummy / stub / spy / mock / fake; `UT-04`/`UT-05` are a real spy and
  a real mock, and every double is commented with its type + why (Lab 03).
- **Test data** — Test Data Builders (`support/builders.ts`), a **seeded** faker so random
  data is repeatable (`support/seedFaker.ts`), and random values valid per domain (Lab 04).
- **Mock roles, not objects** — the boundaries mocked are our own repositories, never
  `@prisma/client`.

## Structure

```
vitest.config.mts               # Vitest runner (node env + setupFiles), mirrors the reference
assignment/
  auth.service.test.ts          # UT-01/02/03/05/06 — AAA, commented doubles
  auth.controller.test.ts       # UT-04 (spy)
  support/builders.ts           # Test Data Builders + aNationalId()/aLaserCode()
  support/seedFaker.ts          # faker.seed(20261003) once per test file
  vitest.setup.ts               # test-only env (JWT_SECRET)
```

## Notes

- **Runner: Vitest 5**, matching the workshop reference (`953725-workshop/app`). Unit
  tests run as native TS — no transform step.
- **Faker** is pinned to **v9** (the version the workshop standardises on).
- **Branches for 2.2** — see `CODE-COMPARISON.md` for the branch names and reproduction
  commands.

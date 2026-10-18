# 2.1 ออกแบบ Unit Test — ระบบ Authentication (Election App)

**สิ่งที่ทดสอบ (SUT):** ระบบ Authentication ของ Election App คือ สมัครสมาชิก (register),
เข้าสู่ระบบ (login) และดู/แก้โปรไฟล์ (profile)
ไฟล์ที่โจทย์มอบหมาย: `src/controllers/auth.controller.ts`, `src/services/auth.service.ts`,
`src/routes/auth.routes.ts`, `src/repositories/user.repository.ts`

**ไฟล์เทสต์ที่เขียน:**
- [`auth.service.test.ts`](./auth.service.test.ts) — UT-01, UT-02, UT-03, UT-05, UT-06
- [`auth.controller.test.ts`](./auth.controller.test.ts) — UT-04

รวม 6 เคส ตรงกับหมวดที่โจทย์กำหนดในข้อ 2.3 พอดี

---

## 1. หน่วยที่เกี่ยวข้อง

| หน่วย | ชนิด | หน้าที่ |
| --- | --- | --- |
| `AuthService` (`src/services/auth.service.ts`) | SUT (กฎของระบบ) | สมัคร (เช็คซ้ำ → หาเขต → สร้าง), login, profile |
| `AuthController` (`src/controllers/auth.controller.ts`) | SUT (ตัวรับ HTTP) | อ่าน body, เรียก service, เซ็น JWT, ประกอบ response |
| `user.repository` | DOC (เข้าถึงฐานข้อมูล) | อ่าน/เขียน user ผ่าน Prisma |
| `constituency.repository` | DOC (เข้าถึงฐานข้อมูล) | หาเขตจาก `province` + `districtNumber` |
| `jsonwebtoken.sign` | DOC (ไลบรารี) | เซ็น token อายุ 7 วัน |
| `upload.service` | DOC (เก็บไฟล์) | อัปโหลดไฟล์ขึ้น Supabase/S3 (ไม่เกี่ยวใน unit test ชุดนี้) |

DOC = ตัวที่โค้ดเราเรียกใช้ เราทดสอบที่ขอบของ unit จึงแทนของจริงทุกตัวด้วย double
ไม่แตะ Postgres, S3 หรือ network จริงเลย

## 2. รายการเทสต์

| ID | หมวด (§2.3) | Double (ชนิด + เหตุผล) | Arrange → Act → Assert |
| --- | --- | --- | --- |
| `UT-01` | 2.3.1 **Success** | mock repo เป็น module เพื่อคุมผลลัพธ์ | ไม่มี id ซ้ำ + มีเขตอยู่ → สมัคร → ได้ role `VOTER`, เรียก `create` 1 ครั้ง |
| `UT-02` | 2.3.2 **ทางเลือก / ล้มเหลว** | `findByNationalId` คืน user ที่มีอยู่แล้ว | id ซ้ำ → สมัคร → โยน error `…ถูกใช้งานแล้ว`, ไม่เรียก `create` เลย |
| `UT-03` | 2.3.3 **Stub** | stub `constituencyRepo.findByLocation` (คุม input ทางอ้อม) | stub คืนเขต `id 42` → สมัคร → `create` ได้ `constituency.connect.id = 42` |
| `UT-04` | 2.3.4 **Spy** | `vi.spyOn(jwt, 'sign')` ดักตัวเซ็นของจริง | login สำเร็จ → controller เซ็น → spy เห็น claims `{ id, nationalId, role }` |
| `UT-05` | 2.3.5 **Mock** | `vi.mocked(userRepo.findByNationalId)` ตรวจการถูกเรียก | login → repo ถูกถาม **ครั้งเดียว** ด้วย national id แล้วคืน user |
| `UT-06` | 2.3.6 **Faker** | ไม่มี double ใช้ service จริง — faker สร้าง input | สุ่ม (แบบ fix seed) เลขบัตร 13 หลัก + laserCode → login → คืน user ที่ตรงกัน |

## 3. เหตุผลการออกแบบ

- **AAA + ทดสอบทีละพฤติกรรม** (Lab 02) — มี `// Arrange`, `// Act`, `// Assert` ชัดเจน
  ทำงานเดียว ไม่มีลูปหรือ `if` ในเทสต์
- **ตั้งชื่อ double ตามการใช้งาน** (Lab 03) — จริง ๆ `vi.fn()` จะเป็น stub / spy / mock
  ขึ้นกับว่าเอาไปทำอะไร แต่ละตัวจึงคอมเมนต์บอกว่าเป็นอะไรและทำไม
  `UT-04` เป็น **spy** จริง (ดัก `jsonwebtoken.sign` ตัวจริง), `UT-05` เป็น **mock** จริง
  (ตรวจการถูกเรียก), `UT-03` เป็น **stub** จริง (ป้อน input ทางอ้อม)
- **สองจุดเชื่อม ใช้สองวิธี** — `AuthService` import repo มาเป็น module จึงต้องใช้
  `vi.mock(...)`; ส่วน `AuthController` รับ `AuthService` ผ่าน constructor จึงแค่ส่ง
  fake เข้าไป เป้าหมายเดียวกัน (แยก unit ออกจากกัน) แต่ใช้เครื่องมือต่างกันตามดีไซน์
- **mock บทบาทของเรา ไม่ mock ไลบรารี** — mock แค่ `user.repository` /
  `constituency.repository` ของเรา ไม่ไป mock `@prisma/client` หรือ `pg`
- **แบ่งกลุ่มข้อมูล** — register กับ login คือกลุ่ม input สองแบบ, สำเร็จกับ id ซ้ำ คือ
  กลุ่มผลลัพธ์: `UT-01`/`UT-06` ครอบเคสปกติ, `UT-02` ครอบเคส error
- **แยกอิสระ + F.I.R.S.T.** — reset `vi.fn()` ทุกครั้งใน `beforeEach`, คืนค่า spy ใน
  `afterEach`, faker fix seed เพื่อให้รันซ้ำได้ผลเดิม

## 4. ข้อมูลทดสอบ (Lab 04)

- **ใช้ Builder ไม่ใช้ fixture กลาง** — `UserBuilder`/`USER()` และ
  `ConstituencyBuilder`/`CONSTITUENCY()` (`support/builders.ts`) จะได้ข้อมูลที่ถูกต้อง
  โดยปริยาย และเทสต์แก้เฉพาะ field ที่สนใจ → ไม่มี Mystery Guest และไม่ผูกกันเกินไป
- **faker กำหนดผลได้** — `support/seedFaker.ts` เรียก `faker.seed(20261003)` และถูกโหลด
  ผ่าน `setupFiles` ใน `vitest.config.mts`
- **ข้อมูลสุ่มต้องถูกตามโดเมน** — `aNationalId()` เป็นเลข 13 หลัก, `aLaserCode()` เป็น
  ตัวอักษรพิมพ์ใหญ่ 10 ตัว เทสต์จะไม่แดงเพราะ "ข้อมูลสุ่มไม่ถูก" แทนที่จะแดงเพราะโค้ดพัง

## 5. วิธีรัน

```bash
npm test                 # คำสั่งเดียว — รัน 6 เคสของงานนี้ (Vitest)
npx tsc --noEmit         # เช็ค TypeScript (Vitest เองไม่เช็ค type)
```

## 6. โครงสร้างไฟล์

```
vitest.config.mts               # ตัวรัน Vitest: node env + setupFiles
assignment/
  auth.service.test.ts          # UT-01/02/03/05/06 — AAA พร้อมคอมเมนต์บอกชนิด double
  auth.controller.test.ts       # UT-04 (spy)
  support/builders.ts           # Test Data Builders + aNationalId()/aLaserCode()
  support/seedFaker.ts          # faker แบบ fix seed (seed ต่อไฟล์)
  vitest.setup.ts               # env ที่ใช้เฉพาะตอนเทสต์ (JWT_SECRET)
```

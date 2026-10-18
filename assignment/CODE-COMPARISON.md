# 2.2 เปรียบเทียบโค้ด — โค้ดเดิม vs หลังทำ V&V (Authentication)

**สิ่งที่ส่ง:** เก็บโค้ดสองเวอร์ชันไว้คนละ branch แล้วเอกสารนี้สรุปว่าอะไรเหมือนเดิม
อะไรเปลี่ยน และเปลี่ยนเพราะอะไร

## 1. สอง branch

| Branch | อ้างอิง commit | ความหมาย |
| --- | --- | --- |
| `backend/original` | `14385de` *"Add initial project structure…"* (2026-01-18) | โค้ดเวอร์ชันที่ส่งครั้งแรกของวิชา Backend |
| `vv/improved` | `4f1eb33` (`main` ปัจจุบัน, 2026-03-24) | โค้ดเวอร์ชันเดียวกันหลังทำ Verification & Validation |

สร้างโดยไม่ไปแก้ประวัติ commit:

```bash
git branch backend/original 14385de   # เวอร์ชันเดิม
git branch vv/improved     main       # เวอร์ชันหลังทำ V&V
```

### วิธีดู diff เอง

```bash
git diff --stat backend/original vv/improved
git diff backend/original vv/improved -- src/services/auth.service.ts src/controllers/auth.controller.ts
git diff backend/original vv/improved -- src/repositories/user.repository.ts src/routes/auth.routes.ts
git diff backend/original vv/improved -- prisma/schema.prisma
```

## 2. ส่วนที่เหมือนเดิม

- **ตัวโปรดักต์ เทคโนโลยี และโครงสร้าง** — Node.js, Express 5, TypeScript, Prisma,
  PostgreSQL (Supabase) และสถาปัตยกรรมแบบแยกชั้น Controller → Service → Repository
  ไม่เปลี่ยนเฟรมเวิร์ก
- **สัญญาของ endpoint สมัคร** — `POST /api/auth/register` ยังรับ `nationalId` + ชื่อ +
  ที่อยู่ + `province` + `districtNumber`, หาเขต, สร้างเป็น `VOTER` และตอบ `201`
- **โมเดล role** — enum `VOTER / EC / ADMIN` และคีย์ unique ของ `Constituency`
  (`@@unique([province, districtNumber])`) ไม่เปลี่ยน
- **จุดเชื่อมที่ทดสอบได้ของ controller** — `AuthController` รับ `AuthService` ผ่าน
  constructor อยู่แล้ว (`constructor(private authService = new AuthService())`)
  จุดนี้เองที่ทำให้ `UT-04` ยัด fake service เข้าไปได้

## 3. ส่วนที่เปลี่ยน และเหตุผล

### 3.1 ฟีเจอร์ Authentication — ความถูกต้องและความครบถ้วน

| # | เดิม | ใหม่ | เหตุผล |
| --- | --- | --- | --- |
| 1 | `registerUser` สร้าง user **โดยไม่เช็คว่าเลขบัตรซ้ำหรือยัง** | เช็ค `userRepo.findByNationalId` ก่อน แล้วโยน `เลขบัตรประชาชน … ถูกใช้งานแล้ว` | `nationalId` เป็น `@unique` ถ้าซ้ำจะได้ error ดิบ ๆ จาก Prisma ตอนนี้ได้ error ที่อ่านรู้เรื่อง (และมี `UT-02` คุมไว้) |
| 2 | **ไม่มี login** และ **ไม่มี token** — สมัครเสร็จคืนแถวจาก DB ตรง ๆ ยังไม่มีแนวคิดเรื่อง session | เพิ่ม `loginUser` (หา user + ตรวจ `laserCode`) และ controller เซ็น **JWT อายุ 7 วัน** ตอนสมัครก็คืน token ด้วย | ถ้าไม่ตรวจ credential และไม่มี token ก็ทำ Authentication ไม่ได้ |
| 3 | ใครใส่เลขบัตรอะไรก็สมัครได้ ไม่มีปัจจัยที่สอง | เพิ่มการตรวจ `laserCode` (เลขหลังบัตร) ตอน login และเพิ่ม field นี้ใน `User` | ผูก session กับสิ่งที่เจ้าของบัตรเท่านั้นที่รู้ |
| 4 | controller **ไม่ตรวจ input** — field ขาดก็ไหลลง service/DB | `register`/`login` คืน `400` เมื่อ field จำเป็นไม่ครบ ก่อนจะแตะ DB | พังเร็วและบอกสาเหตุชัด และกันข้อมูลเสียเข้า DB |
| 5 | มีแค่ `register` | เพิ่ม `getProfile`, `updateProfile`, `uploadProfileImage` (+ `PUT /profile`, `GET /me`, `POST /upload-profile-image`) | ระบบ auth ที่ใช้งานได้จริงต้องดู/แก้โปรไฟล์และอัปรูปได้ |

### 3.2 สถาปัตยกรรม (แยกหน้าที่ให้ชัด และเทสต์ง่ายขึ้น)

| เดิม | ใหม่ | เหตุผล |
| --- | --- | --- |
| `user.repository.ts` รวมทั้งการเขียน user **และ** การหา constituency (`findConstituencyByLocation`) ไว้ด้วยกัน | ย้ายการหาเขตไป `constituency.repository.ts::findByLocation` และ user repo เหลือ `create / findById / findByNationalId / update / updateRole / …` | หนึ่ง repository ต่อหนึ่งเรื่อง (single responsibility) ทำให้ `UT-03` stub เฉพาะเรื่องเขตที่สนใจได้พอดี |
| repo import Prisma จาก `@prisma/client` แต่ service import จาก `../generated/prisma` — ไม่ตรงกัน | สั่ง generate Prisma ไปที่ **`src/generated/prisma`** (ตั้ง `output` ใน `schema.prisma`) แล้ว import จากที่เดียวกันหมด | มี client ตัวเดียวชัดเจน และทำให้ import `$Enums` ได้ |
| **ไม่มี middleware auth/role** | เพิ่ม `auth.middleware.ts` (`authenticate`: ตรวจ JWT → ใส่ `req.user`) และ `role.middleware.ts` (`authorize('ADMIN'|'EC')`) | ย้ายเรื่องตัดขวางออกจาก controller  route ที่ต้องป้องกันก็แค่ประกอบ middleware แทนที่จะเช็ค token เองซ้ำ ๆ |
| ยังไม่มีเรื่องไฟล์/โครงสร้าง | เพิ่ม `upload.service.ts`, `lib/s3.ts`, `upload.middleware.ts`, Prisma migration + seed และเอกสาร Swagger | ทำให้อัปรูปโปรไฟล์ได้และมีเอกสาร API |

### 3.3 Schema (เพิ่มเป็นหลัก และปรับให้เป็นบรรทัดฐานหนึ่งจุด)

| เดิม | ใหม่ | เหตุผล |
| --- | --- | --- |
| `User` ไม่มี `laserCode`, `title`, `imageUrl` ส่วน `Candidate` เก็บ `title/firstName/lastName/imageUrl` เอง | `User` เพิ่ม `laserCode`, `title`, `imageUrl` และ `Candidate` **สืบทอด** ข้อมูลบุคคลผ่าน `userId` (`@unique`) | candidate ก็คือ user คนหนึ่ง ข้อมูลบุคคลควรอยู่ที่เดียว และ login ต้องใช้ `laserCode` จาก `User` |
| `Candidate` ไม่มีกฎเรื่องพรรคต่อเขต | เพิ่ม `@@unique([constituencyId, partyId])` | พรรคหนึ่งส่งผู้สมัครในเขตหนึ่งได้แค่คนเดียว |

## 4. เปรียบเทียบระดับโค้ด — Authentication (จุดที่โจทย์สนใจ)

**`src/services/auth.service.ts`**

```diff
- public registerUser = async (nationalId, name, surname, address, province, districtNumber) => {
-   const constituency = await userRepo.findConstituencyByLocation(province, districtNumber);
-   if (!constituency) throw new Error(`ไม่พบเขตเลือกตั้ง: …`);
-   const user = await userRepo.createUser({ nationalId, firstName: name, … });
-   return user;
- }
+ public registerUser = async (nationalId, laserCode, title, firstName, lastName, address, imageUrl, province, districtNumber) => {
+   const existingUser = await userRepo.findByNationalId(nationalId);
+   if (existingUser) throw new Error(`เลขบัตรประชาชน ${nationalId} ถูกใช้งานแล้ว`);
+   const constituency = await constituencyRepo.findByLocation(province, districtNumber);
+   if (!constituency) throw new Error(`ไม่พบเขตเลือกตั้ง: …`);
+   return await userRepo.create({ nationalId, laserCode, role: $Enums.Role.VOTER, constituency: { connect: { id: constituency.id } }, … });
+ }
+ public loginUser = async (nationalId, laserCode) => { … ตรวจ laserCode … }
+ public getUserProfile / updateProfile / uploadProfileImage = …
```

**`src/controllers/auth.controller.ts`** — จาก *คืนแถวดิบ* เป็น *ตรวจ → เซ็น → จัดรูป*:

```diff
-   const newUser = await this.authService.registerUser(nationalId, name, surname, address, province, districtNumber);
-   res.status(201).json({ success: true, message: "Registration successful", data: newUser });
+   const token = jwt.sign({ id, nationalId, role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
+   res.status(201).json({ success: true, message: "ลงทะเบียนสำเร็จ", data: { user: { … เฉพาะ field ที่ควรส่ง … }, token } });
+   // + login(), getProfile(), updateProfile(), uploadProfileImage()
```

**`src/routes/auth.routes.ts`** — จาก route เดียวเป็นโมดูลที่มีเอกสาร:

```diff
- router.post("/register", authController.register);
+ router.post("/register", authController.register);
+ router.post("/login", authController.login);
+ router.get("/me", authenticate, authController.getProfile);
+ router.put("/profile", authenticate, authController.updateProfile);
+ router.post("/upload-profile-image", authenticate, uploadImage, handleMulterError, authController.uploadProfileImage);
```

**ผลลัพธ์:** ใน `backend/original` ตรรกะการสมัคร **ไม่มีเทสต์และไม่มีจุดให้เทสต์**
(เรื่อง id ซ้ำ, ไม่เจอเขต, รูปร่างข้อมูลที่คืน ต้องลองมือกับ Postgres จริงเท่านั้น)
ส่วน `vv/improved` ฟีเจอร์เดียวกันถูกคลุมด้วย `UT-01` – `UT-06` ผ่าน **stub**, **mock**,
**spy**, builder และ Faker — ดูรายละเอียดที่ [`UNIT-TEST-DESIGN.md`](./UNIT-TEST-DESIGN.md)

## 5. ผลที่ได้

| หัวข้อ | `backend/original` | `vv/improved` |
| --- | --- | --- |
| เทสต์อัตโนมัติของฟีเจอร์นี้ | 0 | 6 (`UT-01`–`UT-06`) |
| endpoint ของ auth | 1 (`/register`) | 5 (`/register`, `/login`, `/me`, `/profile`, `/upload-profile-image`) |
| กันเลขบัตรซ้ำ | ไม่มี | เช็คก่อน insert |
| session token | ไม่มี | JWT อายุ 7 วัน |
| middleware auth/authorize | ไม่มี | `authenticate` + `authorize` |
| ที่อยู่ของโค้ดหาเขต | อยู่ใน `user.repository` | ย้ายไป `constituency.repository` |

**สรุป.** โค้ด auth เดิมทำงานได้แค่เส้นทางสำเร็จเส้นเดียว แต่ตรวจสอบยากและยังไม่ครบ:
login ไม่ได้, รับเลขบัตรอะไรก็ได้, และเอาการหาเขตไปปนไว้ใน user repository
รอบ V&V จึงเติมส่วนที่ขาด (login, JWT, ตรวจ laserCode, กันเลขบัตรซ้ำ, โปรไฟล์)
แยกหน้าที่ออกเป็น repository ย่อย ๆ และห่อพฤติกรรมด้วยเทสต์อัตโนมัติ
ให้ถูกตรวจทุกครั้งที่แก้โค้ด แทนที่จะต้องมานั่งกดลองเอง

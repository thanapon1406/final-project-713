# 🗳️ เอกสารประกอบระบบเลือกตั้งออนไลน์ - ฉบับภาษาไทย

> เอกสารครบถ้วนสำหรับระบบเลือกตั้งออนไลน์
> สร้างด้วย Node.js, Express, TypeScript, Prisma, และ Supabase

---

## 📑 สารบัญ

1. [ภาพรวมโปรเจค](#ภาพรวมโปรเจค)
2. [เริ่มต้นใช้งาน](#เริ่มต้นใช้งาน)
3. [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Documentation](#api-documentation)
6. [คู่มือการทดสอบ](#คู่มือการทดสอบ)
7. [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
8. [สรุปการพัฒนา](#สรุปการพัฒนา)

---

## ภาพรวมโปรเจค

### เกี่ยวกับระบบ

ระบบเลือกตั้งออนไลน์แบบครบวงจร ที่ออกแบบมาเพื่อจัดการการเลือกตั้งในหลายเขตพื้นที่ พร้อมระบบการจัดการพรรคการเมือง ผู้สมัคร และการลงคะแนนเสียง

### เทคโนโลยีที่ใช้

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **ภาษา:** TypeScript
- **ORM:** Prisma v7+
- **ฐานข้อมูล:** PostgreSQL (Supabase)
- **Authentication:** JWT (JSON Web Token)
- **สถาปัตยกรรม:** Layered Architecture (Controller → Service → Repository)

### ฟีเจอร์หลัก

#### 🔐 ระบบ Authentication & Authorization

- ลงทะเบียนและเข้าสู่ระบบด้วย JWT
- Role-based access control (VOTER, EC, ADMIN)
- Token expiration (7 วัน)

#### 👨‍💼 ฟีเจอร์สำหรับ Admin

- สร้างเขตเลือกตั้ง (จังหวัด + เขต)
- เลื่อนตำแหน่งผู้ใช้เป็น EC (กกต.)

#### 👔 ฟีเจอร์สำหรับ EC (กรรมการการเลือกตั้ง)

- สร้างพรรคการเมือง
- เพิ่มผู้สมัคร (ตรวจสอบพรรคและเขต)
- ปิดหีบเลือกตั้ง

#### 🗳️ ฟีเจอร์สำหรับผู้มีสิทธิ์เลือกตั้ง

- ดูบัตรเลือกตั้ง (รายชื่อผู้สมัครในเขตของตน)
- ลงคะแนนเสียง
- เปลี่ยนคะแนนได้ก่อนปิดหีบ (upsert)

#### 📊 ฟีเจอร์สาธารณะ

- ดูผลการเลือกตั้งในแต่ละเขต (ซ่อน/แสดงคะแนนตามสถานะ)
- ดูภาพรวมพรรคการเมืองพร้อมจำนวน ส.ส.

---

## เริ่มต้นใช้งาน

### ความต้องการของระบบ

- Node.js v18.0 หรือสูงกว่า
- npm หรือ yarn
- ฐานข้อมูล PostgreSQL (แนะนำ Supabase)

### การติดตั้ง

#### 1. Clone โปรเจค

```bash
git clone <your-repo-url>
cd final-project-713
```

#### 2. ติดตั้ง Dependencies

```bash
npm install
```

#### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3000
NODE_ENV=development
```

⚠️ **สำคัญ:** เปลี่ยน `JWT_SECRET` ให้ปลอดภัยก่อนใช้งานจริง

#### 4. Generate Prisma Client

```bash
npx prisma generate
```

#### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

#### 6. เริ่ม Development Server

```bash
npm run dev
```

เซิร์ฟเวอร์จะทำงานที่ `http://localhost:3000`

---

## สถาปัตยกรรมระบบ

### Layered Architecture Pattern

```
┌─────────────────────────────────────────┐
│         ชั้น Controllers                │
│  - จัดการ HTTP requests/responses       │
│  - ตรวจสอบข้อมูลนำเข้า                   │
│  - จัดการข้อผิดพลาด                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          ชั้น Services                  │
│  - ตรรกะธุรกิจ                           │
│  - ตรวจสอบความถูกต้องของข้อมูล          │
│  - โยน Error เมื่อพบปัญหา               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        ชั้น Repositories                │
│  - เข้าถึงฐานข้อมูลผ่าน Prisma          │
│  - CRUD operations                      │
│  - แปลงข้อมูล                           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      ฐานข้อมูล (Supabase/PostgreSQL)    │
└─────────────────────────────────────────┘
```

### โครงสร้างโฟลเดอร์

```
src/
├── controllers/         # HTTP request handlers
│   ├── admin.controller.ts
│   ├── auth.controller.ts
│   ├── election.controller.ts
│   └── vote.controller.ts
├── services/           # Business logic layer
│   ├── admin.service.ts
│   ├── auth.service.ts
│   ├── election.service.ts
│   └── vote.service.ts
├── repositories/       # Database access layer
│   ├── user.repository.ts
│   ├── election.repository.ts
│   └── vote.repository.ts
├── routes/            # API route definitions
│   ├── admin.routes.ts
│   ├── auth.routes.ts
│   ├── election.routes.ts
│   └── vote.routes.ts
├── middlewares/       # Authentication & Authorization
│   ├── auth.middleware.ts
│   └── role.middleware.ts
├── lib/
│   └── prisma.ts     # Prisma client instance
└── server.ts          # Express app setup

prisma/
└── schema.prisma      # Database schema
```

---

## Authentication & Authorization

### 🎭 Roles ในระบบ

| Role      | คำอธิบาย             | สิทธิ์การใช้งาน                  |
| --------- | -------------------- | -------------------------------- |
| **VOTER** | ผู้มีสิทธิ์เลือกตั้ง | ดูบัตรเลือกตั้ง, ลงคะแนนเสียง    |
| **EC**    | กรรมการการเลือกตั้ง  | สร้างพรรค, เพิ่มผู้สมัคร, ปิดหีบ |
| **ADMIN** | ผู้ดูแลระบบ          | สร้างเขต, เลื่อนตำแหน่ง EC       |

### การใช้งาน JWT Token

#### การลงทะเบียนและรับ Token

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890123",
    "name": "สมชาย",
    "surname": "ใจดี",
    "address": "123 ถนนสุขุมวิท",
    "province": "Bangkok",
    "districtNumber": 1
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### การใช้ Token ในการเรียก API

```bash
curl http://localhost:3000/api/votes/ballot/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Error Messages

| HTTP Code | ข้อความ                            | สาเหตุ                            |
| --------- | ---------------------------------- | --------------------------------- |
| 401       | กรุณาล็อกอินเข้าสู่ระบบ            | ไม่มี token หรือ token ไม่ถูกต้อง |
| 401       | Token หมดอายุแล้ว กรุณาล็อกอินใหม่ | Token หมดอายุ                     |
| 403       | คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้    | Role ไม่ตรงกับที่กำหนด            |

---

## API Documentation

### 📋 สรุป API Endpoints

| Method | Endpoint                         | สิทธิ์ | คำอธิบาย            |
| ------ | -------------------------------- | ------ | ------------------- |
| POST   | `/api/auth/register`             | Public | ลงทะเบียนผู้ใช้ใหม่ |
| POST   | `/api/auth/login`                | Public | เข้าสู่ระบบ         |
| GET    | `/api/auth/me`                   | Any    | ดูโปรไฟล์ตนเอง      |
| POST   | `/api/admin/constituency`        | ADMIN  | สร้างเขตเลือกตั้ง   |
| PATCH  | `/api/admin/promote-ec/:userId`  | ADMIN  | เลื่อนเป็น EC       |
| POST   | `/api/election/party`            | EC     | สร้างพรรค           |
| POST   | `/api/election/candidate`        | EC     | เพิ่มผู้สมัคร       |
| PATCH  | `/api/election/close/:id`        | EC     | ปิดหีบ              |
| GET    | `/api/votes/ballot/:userId`      | VOTER  | ดูบัตรเลือกตั้ง     |
| POST   | `/api/votes`                     | VOTER  | ลงคะแนนเสียง        |
| GET    | `/api/election/constituency/:id` | Public | ดูผลเขต             |
| GET    | `/api/election/party-overview`   | Public | ดูภาพรวมพรรค        |

### 🔐 Authentication Endpoints

#### 1. ลงทะเบียน

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "nationalId": "1234567890123",
  "name": "สมชาย",
  "surname": "ใจดี",
  "address": "123 ถนนสุขุมวิท",
  "province": "Bangkok",
  "districtNumber": 1
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "data": {
    "user": {
      "id": 1,
      "nationalId": "1234567890123",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "role": "VOTER",
      "constituency": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. เข้าสู่ระบบ

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "nationalId": "1234567890123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. ดูโปรไฟล์

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nationalId": "1234567890123",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "role": "VOTER",
    "constituency": { ... }
  }
}
```

### 👨‍💼 Admin Endpoints

#### 1. สร้างเขตเลือกตั้ง

**POST** `/api/admin/constituency`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**

```json
{
  "province": "Bangkok",
  "districtNumber": 1
}
```

#### 2. เลื่อนตำแหน่งเป็น EC

**PATCH** `/api/admin/promote-ec/:userId`

**Headers:** `Authorization: Bearer <admin-token>`

### 👔 EC Endpoints

#### 1. สร้างพรรคการเมือง

**POST** `/api/election/party`

**Headers:** `Authorization: Bearer <ec-token>`

**Request Body:**

```json
{
  "name": "พรรคก้าวหน้า",
  "logoUrl": "https://example.com/logo.png",
  "policy": "นโยบายของพรรค..."
}
```

#### 2. เพิ่มผู้สมัคร

**POST** `/api/election/candidate`

**Headers:** `Authorization: Bearer <ec-token>`

**Request Body:**

```json
{
  "candidateNumber": 1,
  "title": "นาย",
  "firstName": "ธนวัฒน์",
  "lastName": "พงศ์พันธ์",
  "imageUrl": "https://example.com/photo.jpg",
  "policy": "นโยบายส่วนตัว...",
  "partyId": 1,
  "constituencyId": 1
}
```

**การตรวจสอบ:**

- ✅ ตรวจสอบว่าพรรคมีอยู่จริง
- ✅ ตรวจสอบว่าเขตเลือกตั้งมีอยู่จริง

#### 3. ปิดหีบเลือกตั้ง

**PATCH** `/api/election/close/:id`

**Headers:** `Authorization: Bearer <ec-token>`

### 🗳️ Voter Endpoints

#### 1. ดูบัตรเลือกตั้ง

**GET** `/api/votes/ballot/:userId`

**Headers:** `Authorization: Bearer <voter-token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "constituency": {
      "id": 1,
      "province": "Bangkok",
      "districtNumber": 1,
      "isClosed": false
    },
    "candidates": [
      {
        "id": 1,
        "candidateNumber": 1,
        "title": "นาย",
        "firstName": "ธนวัฒน์",
        "lastName": "พงศ์พันธ์",
        "party": {
          "id": 1,
          "name": "พรรคก้าวหน้า",
          "logoUrl": "..."
        }
      }
    ]
  }
}
```

#### 2. ลงคะแนนเสียง

**POST** `/api/votes`

**Headers:** `Authorization: Bearer <voter-token>`

**Request Body:**

```json
{
  "userId": 1,
  "candidateId": 1
}
```

**ตรรกะการทำงาน:**

1. ✅ ตรวจสอบว่าเขตปิดแล้วหรือยัง → ถ้าปิดแล้ว error
2. ✅ ตรวจสอบผู้สมัครอยู่ในเขตเดียวกันหรือไม่
3. ✅ ใช้ upsert อนุญาตให้เปลี่ยนคะแนนได้

### 📊 Public Endpoints

#### 1. ดูผลการเลือกตั้งในเขต

**GET** `/api/election/constituency/:id`

**ตรรกะการแสดงผล:**

- **ถ้าหีบเปิด (`isClosed = false`)**: แสดงรายชื่อผู้สมัคร, `voteCount = null`
- **ถ้าหีบปิด (`isClosed = true`)**: แสดงรายชื่อผู้สมัคร, `voteCount = จำนวนจริง`

**Response (หีบปิด):**

```json
{
  "success": true,
  "data": {
    "constituency": {
      "id": 1,
      "province": "Bangkok",
      "districtNumber": 1,
      "isClosed": true
    },
    "candidates": [
      {
        "id": 1,
        "candidateNumber": 1,
        "firstName": "ธนวัฒน์",
        "lastName": "พงศ์พันธ์",
        "party": { ... },
        "voteCount": 1250
      }
    ]
  }
}
```

#### 2. ดูภาพรวมพรรคการเมือง

**GET** `/api/election/party-overview`

**ตรรกะการนับ ส.ส.:**

- นับเฉพาะเขตที่ `isClosed = true`
- ผู้สมัครที่ได้คะแนนสูงสุดในแต่ละเขต = 1 ส.ส. ให้พรรคนั้น

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "พรรคก้าวหน้า",
      "logoUrl": "...",
      "policy": "...",
      "totalElectedMPs": 5
    },
    {
      "id": 2,
      "name": "พรรคประชาธิปัตย์",
      "logoUrl": "...",
      "policy": "...",
      "totalElectedMPs": 3
    }
  ]
}
```

---

## คู่มือการทดสอบ

### การเตรียมระบบ

```bash
# 1. สร้าง Prisma Client
npx prisma generate

# 2. Migrate ฐานข้อมูล
npx prisma migrate dev

# 3. เริ่มเซิร์ฟเวอร์
npm run dev
```

### Flow การทดสอบ

#### Flow 1: ผู้ใช้ทั่วไป → ผู้มีสิทธิ์เลือกตั้ง

```bash
# 1. ลงทะเบียน
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1111111111111",
    "name": "ผู้ทดสอบ",
    "surname": "หนึ่ง",
    "address": "123",
    "province": "Bangkok",
    "districtNumber": 1
  }'

# เก็บ token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. ดูบัตรเลือกตั้ง
curl http://localhost:3000/api/votes/ballot/1 \
  -H "Authorization: Bearer $TOKEN"

# 3. ลงคะแนนเสียง
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 1}'

# 4. เปลี่ยนคะแนนเสียง (ถ้าหีบยังเปิด)
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 2}'
```

#### Flow 2: Admin จัดการระบบ

```bash
# 1. Login ด้วย Admin account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "9999999999999"}'

ADMIN_TOKEN="..."

# 2. สร้างเขตเลือกตั้ง
curl -X POST http://localhost:3000/api/admin/constituency \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"province": "Chiang Mai", "districtNumber": 1}'

# 3. เลื่อนผู้ใช้เป็น EC
curl -X PATCH http://localhost:3000/api/admin/promote-ec/5 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Flow 3: EC จัดการการเลือกตั้ง

```bash
# 1. Login ด้วย EC account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "8888888888888"}'

EC_TOKEN="..."

# 2. สร้างพรรคการเมือง
curl -X POST http://localhost:3000/api/election/party \
  -H "Authorization: Bearer $EC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "พรรคทดสอบ",
    "logoUrl": "https://example.com/logo.png",
    "policy": "นโยบาย..."
  }'

# 3. เพิ่มผู้สมัคร
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Authorization: Bearer $EC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 1,
    "title": "นาย",
    "firstName": "ทดสอบ",
    "lastName": "ผู้สมัคร",
    "partyId": 1,
    "constituencyId": 1
  }'

# 4. ปิดหีบ
curl -X PATCH http://localhost:3000/api/election/close/1 \
  -H "Authorization: Bearer $EC_TOKEN"
```

#### Flow 4: ดูผลการเลือกตั้ง

```bash
# 1. ดูผลในเขต (Public - ไม่ต้อง token)
curl http://localhost:3000/api/election/constituency/1

# 2. ดูภาพรวมพรรค (Public)
curl http://localhost:3000/api/election/party-overview
```

### การทดสอบ Error Cases

```bash
# 1. ลงคะแนนในหีบที่ปิดแล้ว (ควรได้ error)
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 1}'

# 2. เพิ่มผู้สมัครโดยไม่มีพรรค (ควรได้ error)
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Authorization: Bearer $EC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 99,
    "firstName": "Test",
    "lastName": "Test",
    "partyId": 999,
    "constituencyId": 1
  }'

# 3. ลงคะแนนให้ผู้สมัครคนละเขต (ควรได้ error)
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 99}'
```

---

## โครงสร้างฐานข้อมูล

### Models หลัก

#### Constituency (เขตเลือกตั้ง)

```prisma
model Constituency {
  id             Int         @id @default(autoincrement())
  province       String
  districtNumber Int
  isClosed       Boolean     @default(false)
  users          User[]
  candidates     Candidate[]

  @@unique([province, districtNumber])
}
```

#### Party (พรรคการเมือง)

```prisma
model Party {
  id         Int         @id @default(autoincrement())
  name       String      @unique
  logoUrl    String?
  policy     String?     @db.Text
  candidates Candidate[]
}
```

#### User (ผู้ใช้งาน)

```prisma
model User {
  id             Int          @id @default(autoincrement())
  nationalId     String       @unique
  firstName      String
  lastName       String
  address        String?      @db.Text
  role           Role         @default(VOTER)
  constituencyId Int
  constituency   Constituency @relation(fields: [constituencyId], references: [id])
  vote           Vote?
}
```

#### Candidate (ผู้สมัคร)

```prisma
model Candidate {
  id              Int          @id @default(autoincrement())
  candidateNumber Int
  title           String?
  firstName       String
  lastName        String
  imageUrl        String?
  policy          String?      @db.Text
  partyId         Int
  party           Party        @relation(fields: [partyId], references: [id])
  constituencyId  Int
  constituency    Constituency @relation(fields: [constituencyId], references: [id])
  votes           Vote[]

  @@unique([constituencyId, candidateNumber])
}
```

#### Vote (การลงคะแนน)

```prisma
model Vote {
  id          Int       @id @default(autoincrement())
  timestamp   DateTime  @default(now())
  userId      Int       @unique
  candidateId Int
  user        User      @relation(fields: [userId], references: [id])
  candidate   Candidate @relation(fields: [candidateId], references: [id])
}
```

### Relationships

- User → Constituency (many-to-one)
- User → Vote (one-to-one)
- Candidate → Party (many-to-one)
- Candidate → Constituency (many-to-one)
- Vote → User (many-to-one)
- Vote → Candidate (many-to-one)

---

## สรุปการพัฒนา

### ✅ ฟีเจอร์ที่พัฒนาเสร็จสมบูรณ์

#### A. ฟีเจอร์ Admin

1. ✅ สร้างเขตเลือกตั้ง - ตรวจสอบความไม่ซ้ำกัน
2. ✅ เลื่อนตำแหน่งผู้ใช้เป็น EC - ป้องกันการเปลี่ยน Admin → EC

#### B. ฟีเจอร์ EC

1. ✅ สร้างพรรคการเมือง
2. ✅ เพิ่มผู้สมัคร - ตรวจสอบพรรคและเขตมีอยู่จริง
3. ✅ ปิดหีบเลือกตั้ง

#### C. ฟีเจอร์ผู้มีสิทธิ์เลือกตั้ง

1. ✅ ดูบัตรเลือกตั้ง - รายชื่อผู้สมัครในเขตของตน
2. ✅ ลงคะแนนเสียง - พร้อมการตรวจสอบครบถ้วน
3. ✅ เปลี่ยนคะแนนได้ (ก่อนปิดหีบ)

#### D. ฟีเจอร์สาธารณะ

1. ✅ ดูผลการเลือกตั้ง - ซ่อน/แสดงคะแนนตามสถานะ
2. ✅ ภาพรวมพรรคการเมือง - นับ ส.ส. จากเขตที่ปิดแล้ว

#### E. Authentication & Authorization

1. ✅ JWT Token authentication
2. ✅ Role-based access control
3. ✅ Protected endpoints
4. ✅ Token expiration (7 วัน)

### 🏗️ คุณสมบัติเด่น

- ✅ **Layered Architecture** - แยกชั้นชัดเจน
- ✅ **Type Safety** - TypeScript ทั้งระบบ
- ✅ **Error Handling** - จัดการ error ครบถ้วน
- ✅ **Validation** - ตรวจสอบข้อมูลทุกชั้น
- ✅ **Security** - JWT + Role-based access control
- ✅ **Database** - Prisma ORM กับ PostgreSQL
- ✅ **Clean Code** - อ่านง่าย บำรุงรักษาง่าย
- ✅ **Thai Language** - ข้อความ error เป็นภาษาไทย

### 📊 สถิติการพัฒนา

- **Controllers:** 4 ไฟล์
- **Services:** 4 ไฟล์
- **Repositories:** 3 ไฟล์
- **Routes:** 4 ไฟล์
- **Middlewares:** 2 ไฟล์
- **API Endpoints:** 12 endpoints
- **Database Models:** 5 models

---

## 🔒 Security Considerations

### ที่ทำแล้ว

- ✅ JWT Token authentication
- ✅ Role-based authorization
- ✅ Token expiration
- ✅ Protected routes
- ✅ Input validation
- ✅ Error messages ที่เหมาะสม

### ควรเพิ่มใน Production

- 🔄 Rate limiting
- 🔄 HTTPS/TLS
- 🔄 Token refresh mechanism
- 🔄 Logout/Token blacklist
- 🔄 CORS configuration
- 🔄 Helmet.js security headers
- 🔄 Input sanitization
- 🔄 SQL injection protection (Prisma จัดการให้แล้ว)

---

## 📞 การสนับสนุน

หากมีคำถามหรือปัญหา:

1. ตรวจสอบเอกสารนี้ก่อน
2. ดู error messages ในเทอร์มินัล
3. ตรวจสอบไฟล์ `.env` ว่าตั้งค่าถูกต้อง
4. รัน `npx prisma generate` หลังแก้ schema
5. ตรวจสอบว่า JWT_SECRET ตั้งค่าแล้ว

---

## 🎓 Credits

พัฒนาโดย: [Your Name]  
สำหรับ: Master Degree Project - Year 1.2  
มหาวิทยาลัย: [Your University]  
ปี: 2026

---

## 📄 License

โปรเจคนี้สร้างขึ้นเพื่อการศึกษา

---

**🎉 ระบบพร้อมใช้งานแล้ว! ขอให้สนุกกับการพัฒนา!**

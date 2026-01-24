# 🗳️ Online Election System - Complete Documentation

> Comprehensive documentation for the Online Election System
> Built with Node.js, Express, TypeScript, Prisma, and Supabase

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [System Architecture](#system-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Documentation](#api-documentation)
6. [Testing Guide](#testing-guide)
7. [Database Schema](#database-schema)
8. [Implementation Summary](#implementation-summary)

---

## Project Overview

### About the System

A comprehensive online election system designed to manage elections across multiple constituencies, with features for political party management, candidate registration, and voting.

### Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma v7+
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT (JSON Web Token)
- **Architecture:** Layered Architecture (Controller → Service → Repository)

### Key Features

#### 🔐 Authentication & Authorization System

- Register and login with JWT
- Role-based access control (VOTER, EC, ADMIN)
- Token expiration (7 days)

#### 👨‍💼 Admin Features

- Create constituencies (province + district)
- Promote users to EC (Election Commissioner) role

#### 👔 EC (Election Commissioner) Features

- Create political parties
- Add candidates (validates party and constituency)
- Close polls

#### 🗳️ Voter Features

- View ballot (list of candidates in their constituency)
- Cast votes
- Change votes before poll closes (upsert)

#### 📊 Public Features

- View constituency results (hide/show votes based on status)
- View party overview with elected MPs count

---

## Getting Started

### Prerequisites

- Node.js v18.0 or higher
- npm or yarn
- PostgreSQL database (Supabase recommended)

### Installation

#### 1. Clone the Project

```bash
git clone <your-repo-url>
cd final-project-713
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file:

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

⚠️ **Important:** Change `JWT_SECRET` to a secure value before production use

#### 4. Generate Prisma Client

```bash
npx prisma generate
```

#### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

#### 6. Start Development Server

```bash
npm run dev
```

Server will run at `http://localhost:3000`

---

## System Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────────┐
│         Controllers Layer               │
│  - Handle HTTP requests/responses       │
│  - Input validation                     │
│  - Error handling                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Services Layer                 │
│  - Business logic                       │
│  - Data validation                      │
│  - Error throwing                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Repositories Layer               │
│  - Database access via Prisma           │
│  - CRUD operations                      │
│  - Data transformation                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Database (Supabase/PostgreSQL)     │
└─────────────────────────────────────────┘
```

### Project Structure

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

### 🎭 System Roles

| Role      | Description           | Permissions                                 |
| --------- | --------------------- | ------------------------------------------- |
| **VOTER** | Eligible voter        | View ballot, cast votes                     |
| **EC**    | Election Commissioner | Create parties, add candidates, close polls |
| **ADMIN** | System administrator  | Create constituencies, promote to EC        |

### Using JWT Tokens

#### Registration and Receiving Token

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890123",
    "name": "John",
    "surname": "Doe",
    "address": "123 Main Street",
    "province": "Bangkok",
    "districtNumber": 1
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Using Token in API Calls

```bash
curl http://localhost:3000/api/votes/ballot/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Error Messages

| HTTP Code | Message                                          | Cause                            |
| --------- | ------------------------------------------------ | -------------------------------- |
| 401       | Please login to the system                       | No token or invalid token        |
| 401       | Token expired, please login again                | Token has expired                |
| 403       | You don't have permission to access this feature | Role doesn't match required role |

---

## API Documentation

### 📋 API Endpoints Summary

| Method | Endpoint                         | Permission | Description         |
| ------ | -------------------------------- | ---------- | ------------------- |
| POST   | `/api/auth/register`             | Public     | Register new user   |
| POST   | `/api/auth/login`                | Public     | User login          |
| GET    | `/api/auth/me`                   | Any        | View own profile    |
| POST   | `/api/admin/constituency`        | ADMIN      | Create constituency |
| PATCH  | `/api/admin/promote-ec/:userId`  | ADMIN      | Promote to EC       |
| POST   | `/api/election/party`            | EC         | Create party        |
| POST   | `/api/election/candidate`        | EC         | Add candidate       |
| PATCH  | `/api/election/close/:id`        | EC         | Close poll          |
| GET    | `/api/votes/ballot/:userId`      | VOTER      | View ballot         |
| POST   | `/api/votes`                     | VOTER      | Cast vote           |
| GET    | `/api/election/constituency/:id` | Public     | View results        |
| GET    | `/api/election/party-overview`   | Public     | View party overview |

### 🔐 Authentication Endpoints

#### 1. Register

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "nationalId": "1234567890123",
  "name": "John",
  "surname": "Doe",
  "address": "123 Main Street",
  "province": "Bangkok",
  "districtNumber": 1
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "nationalId": "1234567890123",
      "firstName": "John",
      "lastName": "Doe",
      "role": "VOTER",
      "constituency": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login

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
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Profile

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
    "firstName": "John",
    "lastName": "Doe",
    "role": "VOTER",
    "constituency": { ... }
  }
}
```

### 👨‍💼 Admin Endpoints

#### 1. Create Constituency

**POST** `/api/admin/constituency`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**

```json
{
  "province": "Bangkok",
  "districtNumber": 1
}
```

#### 2. Promote User to EC

**PATCH** `/api/admin/promote-ec/:userId`

**Headers:** `Authorization: Bearer <admin-token>`

### 👔 EC Endpoints

#### 1. Create Political Party

**POST** `/api/election/party`

**Headers:** `Authorization: Bearer <ec-token>`

**Request Body:**

```json
{
  "name": "Progressive Party",
  "logoUrl": "https://example.com/logo.png",
  "policy": "Party policies..."
}
```

#### 2. Add Candidate

**POST** `/api/election/candidate`

**Headers:** `Authorization: Bearer <ec-token>`

**Request Body:**

```json
{
  "candidateNumber": 1,
  "title": "Mr.",
  "firstName": "Michael",
  "lastName": "Johnson",
  "imageUrl": "https://example.com/photo.jpg",
  "policy": "Personal policies...",
  "partyId": 1,
  "constituencyId": 1
}
```

**Validations:**

- ✅ Validates party exists
- ✅ Validates constituency exists

#### 3. Close Poll

**PATCH** `/api/election/close/:id`

**Headers:** `Authorization: Bearer <ec-token>`

### 🗳️ Voter Endpoints

#### 1. View Ballot

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
        "title": "Mr.",
        "firstName": "Michael",
        "lastName": "Johnson",
        "party": {
          "id": 1,
          "name": "Progressive Party",
          "logoUrl": "..."
        }
      }
    ]
  }
}
```

#### 2. Cast Vote

**POST** `/api/votes`

**Headers:** `Authorization: Bearer <voter-token>`

**Request Body:**

```json
{
  "userId": 1,
  "candidateId": 1
}
```

**Business Logic:**

1. ✅ Check if constituency is closed → error if closed
2. ✅ Validate candidate belongs to user's constituency
3. ✅ Use upsert to allow vote changes

### 📊 Public Endpoints

#### 1. View Constituency Results

**GET** `/api/election/constituency/:id`

**Display Logic:**

- **If poll is open (`isClosed = false`)**: Show candidate names, `voteCount = null`
- **If poll is closed (`isClosed = true`)**: Show candidate names, `voteCount = actual count`

**Response (poll closed):**

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
        "firstName": "Michael",
        "lastName": "Johnson",
        "party": { ... },
        "voteCount": 1250
      }
    ]
  }
}
```

#### 2. View Party Overview

**GET** `/api/election/party-overview`

**MP Counting Logic:**

- Count only from constituencies where `isClosed = true`
- Candidate with highest votes in each constituency = 1 MP for that party

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Progressive Party",
      "logoUrl": "...",
      "policy": "...",
      "totalElectedMPs": 5
    },
    {
      "id": 2,
      "name": "Conservative Party",
      "logoUrl": "...",
      "policy": "...",
      "totalElectedMPs": 3
    }
  ]
}
```

---

## Testing Guide

### System Preparation

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Migrate database
npx prisma migrate dev

# 3. Start server
npm run dev
```

### Testing Flows

#### Flow 1: Regular User → Voter

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1111111111111",
    "name": "Test",
    "surname": "User",
    "address": "123",
    "province": "Bangkok",
    "districtNumber": 1
  }'

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. View ballot
curl http://localhost:3000/api/votes/ballot/1 \
  -H "Authorization: Bearer $TOKEN"

# 3. Cast vote
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 1}'

# 4. Change vote (if poll still open)
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 2}'
```

#### Flow 2: Admin Managing System

```bash
# 1. Login with Admin account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "9999999999999"}'

ADMIN_TOKEN="..."

# 2. Create constituency
curl -X POST http://localhost:3000/api/admin/constituency \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"province": "Chiang Mai", "districtNumber": 1}'

# 3. Promote user to EC
curl -X PATCH http://localhost:3000/api/admin/promote-ec/5 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Flow 3: EC Managing Election

```bash
# 1. Login with EC account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nationalId": "8888888888888"}'

EC_TOKEN="..."

# 2. Create political party
curl -X POST http://localhost:3000/api/election/party \
  -H "Authorization: Bearer $EC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Party",
    "logoUrl": "https://example.com/logo.png",
    "policy": "Policies..."
  }'

# 3. Add candidate
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Authorization: Bearer $EC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 1,
    "title": "Mr.",
    "firstName": "Test",
    "lastName": "Candidate",
    "partyId": 1,
    "constituencyId": 1
  }'

# 4. Close poll
curl -X PATCH http://localhost:3000/api/election/close/1 \
  -H "Authorization: Bearer $EC_TOKEN"
```

#### Flow 4: Viewing Election Results

```bash
# 1. View constituency results (Public - no token needed)
curl http://localhost:3000/api/election/constituency/1

# 2. View party overview (Public)
curl http://localhost:3000/api/election/party-overview
```

### Testing Error Cases

```bash
# 1. Vote in closed poll (should error)
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 1}'

# 2. Add candidate without party (should error)
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

# 3. Vote for candidate in different constituency (should error)
curl -X POST http://localhost:3000/api/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "candidateId": 99}'
```

---

## Database Schema

### Core Models

#### Constituency

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

#### Party

```prisma
model Party {
  id         Int         @id @default(autoincrement())
  name       String      @unique
  logoUrl    String?
  policy     String?     @db.Text
  candidates Candidate[]
}
```

#### User

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

#### Candidate

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

#### Vote

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

## Implementation Summary

### ✅ Completed Features

#### A. Admin Features

1. ✅ Create Constituency - validates uniqueness
2. ✅ Promote User to EC - prevents Admin → EC conversion

#### B. EC Features

1. ✅ Create Political Party
2. ✅ Add Candidate - validates party and constituency exist
3. ✅ Close Poll

#### C. Voter Features

1. ✅ View Ballot - list of candidates in user's constituency
2. ✅ Cast Vote - with comprehensive validation
3. ✅ Change Vote (before poll closes)

#### D. Public Features

1. ✅ View Election Results - hide/show votes based on status
2. ✅ Party Overview - count MPs from closed constituencies only

#### E. Authentication & Authorization

1. ✅ JWT Token authentication
2. ✅ Role-based access control
3. ✅ Protected endpoints
4. ✅ Token expiration (7 days)

### 🏗️ Key Characteristics

- ✅ **Layered Architecture** - clean separation of concerns
- ✅ **Type Safety** - full TypeScript implementation
- ✅ **Error Handling** - comprehensive error management
- ✅ **Validation** - validation at every layer
- ✅ **Security** - JWT + Role-based access control
- ✅ **Database** - Prisma ORM with PostgreSQL
- ✅ **Clean Code** - readable and maintainable
- ✅ **Documentation** - comprehensive API docs

### 📊 Development Statistics

- **Controllers:** 4 files
- **Services:** 4 files
- **Repositories:** 3 files
- **Routes:** 4 files
- **Middlewares:** 2 files
- **API Endpoints:** 12 endpoints
- **Database Models:** 5 models

---

## 🔒 Security Considerations

### Implemented

- ✅ JWT Token authentication
- ✅ Role-based authorization
- ✅ Token expiration
- ✅ Protected routes
- ✅ Input validation
- ✅ Appropriate error messages

### Should Add for Production

- 🔄 Rate limiting
- 🔄 HTTPS/TLS
- 🔄 Token refresh mechanism
- 🔄 Logout/Token blacklist
- 🔄 CORS configuration
- 🔄 Helmet.js security headers
- 🔄 Input sanitization
- 🔄 SQL injection protection (Prisma handles this)

---

## 📞 Support

If you have questions or issues:

1. Check this documentation first
2. Review error messages in terminal
3. Verify `.env` file is configured correctly
4. Run `npx prisma generate` after schema changes
5. Ensure JWT_SECRET is set

---

## 🎓 Credits

Developed by: [Your Name]  
For: Master Degree Project - Year 1.2  
University: [Your University]  
Year: 2026

---

## 📄 License

This project was created for educational purposes.

---

**🎉 System is Ready! Happy Coding!**

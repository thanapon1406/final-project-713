# Online Election System - API Documentation

## Overview

This is a complete implementation of an Online Election System using Express.js, TypeScript, Prisma, and Supabase following the Layered Architecture pattern.

## Architecture

```
Controller → Service → Repository → Database
```

## API Endpoints

### 1. Authentication Routes (`/api/auth`)

#### Register User

- **Endpoint:** `POST /api/auth/register`
- **Description:** Register a new voter in the system
- **Request Body:**

```json
{
  "nationalId": "1234567890123",
  "name": "John",
  "surname": "Doe",
  "address": "123 Main St",
  "province": "Bangkok",
  "districtNumber": 1
}
```

- **Success Response (201):**

```json
{
  "success": true,
  "message": "Registration successful",
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

---

### 2. Admin Routes (`/api/admin`)

#### Create Constituency

- **Endpoint:** `POST /api/admin/constituency`
- **Description:** Admin creates a new constituency/district
- **Request Body:**

```json
{
  "province": "Bangkok",
  "districtNumber": 1
}
```

- **Success Response (201):**

```json
{
  "success": true,
  "message": "สร้างเขตเลือกตั้งสำเร็จ",
  "data": {
    "id": 1,
    "province": "Bangkok",
    "districtNumber": 1,
    "isClosed": false
  }
}
```

#### Promote User to EC

- **Endpoint:** `PATCH /api/admin/promote-ec/:userId`
- **Description:** Admin promotes a voter to EC (Election Commissioner) role
- **URL Parameters:** `userId` (number)
- **Success Response (200):**

```json
{
  "success": true,
  "message": "เปลี่ยน Role เป็น EC สำเร็จ",
  "data": {
    "id": 2,
    "nationalId": "1234567890124",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "EC",
    "constituency": { ... }
  }
}
```

---

### 3. EC (Election Commissioner) Routes (`/api/election`)

#### Create Party

- **Endpoint:** `POST /api/election/party`
- **Description:** EC creates a new political party
- **Request Body:**

```json
{
  "name": "Progressive Party",
  "logoUrl": "https://example.com/logo.png",
  "policy": "Our party stands for progress and innovation..."
}
```

- **Success Response (201):**

```json
{
  "success": true,
  "message": "สร้างพรรคสำเร็จ",
  "data": {
    "id": 1,
    "name": "Progressive Party",
    "logoUrl": "https://example.com/logo.png",
    "policy": "Our party stands for progress and innovation..."
  }
}
```

#### Add Candidate

- **Endpoint:** `POST /api/election/candidate`
- **Description:** EC registers a candidate for election
- **Request Body:**

```json
{
  "candidateNumber": 1,
  "title": "Mr.",
  "firstName": "Michael",
  "lastName": "Johnson",
  "imageUrl": "https://example.com/candidate.jpg",
  "policy": "I will fight for better healthcare...",
  "partyId": 1,
  "constituencyId": 1
}
```

- **Success Response (201):**

```json
{
  "success": true,
  "message": "เพิ่มผู้สมัครสำเร็จ",
  "data": {
    "id": 1,
    "candidateNumber": 1,
    "title": "Mr.",
    "firstName": "Michael",
    "lastName": "Johnson",
    "party": { ... },
    "constituency": { ... }
  }
}
```

#### Close Poll

- **Endpoint:** `PATCH /api/election/close/:id`
- **Description:** EC closes voting in a constituency (start counting votes)
- **URL Parameters:** `id` (constituency ID)
- **Success Response (200):**

```json
{
  "success": true,
  "message": "ปิดการลงคะแนนสำเร็จ",
  "data": {
    "id": 1,
    "province": "Bangkok",
    "districtNumber": 1,
    "isClosed": true
  }
}
```

---

### 4. Voter Routes (`/api/votes`)

#### Get Ballot

- **Endpoint:** `GET /api/votes/ballot/:userId`
- **Description:** Get the list of candidates that a user can vote for
- **URL Parameters:** `userId` (number)
- **Success Response (200):**

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
        "imageUrl": "https://example.com/candidate.jpg",
        "policy": "I will fight for better healthcare...",
        "party": {
          "id": 1,
          "name": "Progressive Party",
          "logoUrl": "https://example.com/logo.png"
        }
      }
    ]
  }
}
```

#### Cast Vote

- **Endpoint:** `POST /api/votes`
- **Description:** User casts or updates their vote
- **Request Body:**

```json
{
  "userId": 1,
  "candidateId": 1
}
```

- **Success Response (200):**

```json
{
  "success": true,
  "message": "ลงคะแนนสำเร็จ",
  "data": {
    "id": 1,
    "timestamp": "2026-01-23T10:30:00.000Z",
    "candidate": {
      "id": 1,
      "candidateNumber": 1,
      "firstName": "Michael",
      "lastName": "Johnson",
      "party": {
        "id": 1,
        "name": "Progressive Party"
      }
    }
  }
}
```

**Business Logic:**

- ✅ Users can only vote in their own constituency
- ✅ Users can change their vote if the poll is still open
- ✅ Users cannot vote if the constituency is closed
- ✅ Uses upsert to allow vote changes

---

### 5. Public Results Routes (`/api/election`)

#### View Constituency Results

- **Endpoint:** `GET /api/election/constituency/:id`
- **Description:** View election results in a constituency
- **URL Parameters:** `id` (constituency ID)
- **Logic:**
  - If poll is **OPEN** (`isClosed = false`): Shows candidate names but `voteCount` is `null`
  - If poll is **CLOSED** (`isClosed = true`): Shows candidate names with actual vote counts

- **Success Response (200) - Poll Open:**

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
        "firstName": "Michael",
        "lastName": "Johnson",
        "party": { ... },
        "voteCount": null  // Hidden when poll is open
      }
    ]
  }
}
```

- **Success Response (200) - Poll Closed:**

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
        "voteCount": 1250  // Actual count when closed
      }
    ]
  }
}
```

#### View Party Overview

- **Endpoint:** `GET /api/election/party-overview`
- **Description:** View all parties with their total elected MPs
- **Logic:**
  - Only counts MPs from **CLOSED** constituencies
  - Each constituency winner counts as 1 MP for their party
- **Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Progressive Party",
      "logoUrl": "https://example.com/logo.png",
      "policy": "Our party stands for progress...",
      "totalElectedMPs": 5
    },
    {
      "id": 2,
      "name": "Conservative Party",
      "logoUrl": "https://example.com/logo2.png",
      "policy": "Traditional values...",
      "totalElectedMPs": 3
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description in Thai or English"
}
```

Common HTTP Status Codes:

- `200` - Success (GET, PATCH)
- `201` - Created (POST)
- `400` - Bad Request (validation errors, business logic errors)
- `500` - Internal Server Error

---

## Database Schema Summary

### User

- `id`, `nationalId`, `firstName`, `lastName`, `address`, `role` (VOTER/EC/ADMIN), `constituencyId`

### Constituency

- `id`, `province`, `districtNumber`, `isClosed`

### Party

- `id`, `name`, `logoUrl`, `policy`

### Candidate

- `id`, `candidateNumber`, `title`, `firstName`, `lastName`, `imageUrl`, `policy`, `partyId`, `constituencyId`

### Vote

- `id`, `userId`, `candidateId`, `timestamp`

---

## Key Features Implemented

### ✅ Admin Features

1. Create Constituency
2. Promote User to EC

### ✅ EC Features

1. Create Party (with validation)
2. Add Candidate (validates party exists)
3. Close Election Poll

### ✅ Voter Features

1. Get Ballot (candidates in user's constituency)
2. Cast Vote with validations:
   - Check if constituency is closed
   - Check if candidate belongs to user's constituency
   - Allow vote changes via upsert

### ✅ Public Results

1. View Constituency Result (hide/show votes based on status)
2. View Party Overview (count elected MPs from closed constituencies only)

---

## File Structure

```
src/
├── controllers/
│   ├── admin.controller.ts       # Admin endpoints
│   ├── auth.controller.ts        # User registration
│   ├── election.controller.ts    # EC & public results
│   └── vote.controller.ts        # Voter actions
├── services/
│   ├── admin.service.ts          # Admin business logic
│   ├── auth.service.ts           # Registration logic
│   ├── election.service.ts       # Election business logic
│   └── vote.service.ts           # Voting logic
├── repositories/
│   ├── user.repository.ts        # User & constituency data access
│   ├── election.repository.ts    # Party, candidate, results data access
│   └── vote.repository.ts        # Vote data access
├── routes/
│   ├── admin.routes.ts
│   ├── auth.routes.ts
│   ├── election.routes.ts
│   └── vote.routes.ts
├── lib/
│   └── prisma.ts                 # Prisma client singleton
└── server.ts                      # Express app setup
```

---

## Testing the API

You can test the API using tools like:

- **Postman**
- **Thunder Client** (VS Code extension)
- **cURL**

Example workflow:

1. Admin creates constituencies
2. Users register with their constituency
3. Admin promotes some users to EC
4. EC creates parties
5. EC adds candidates
6. Voters get their ballots
7. Voters cast votes
8. EC closes polls
9. Public views results

---

## Notes

- All error messages are in Thai for user-facing errors
- Uses Prisma's upsert for vote changes
- Proper validation at each layer
- Clean separation of concerns following layered architecture
- Follows existing codebase patterns and conventions

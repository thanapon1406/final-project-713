# Quick Testing Guide

## Setup Instructions

1. Make sure your Prisma schema is up to date:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

2. Start the server:

```bash
npm run dev
# or
npx nodemon
```

## Testing Flow (Step by Step)

### Step 1: Admin Creates Constituencies

```bash
# Create Bangkok District 1
curl -X POST http://localhost:3000/api/admin/constituency \
  -H "Content-Type: application/json" \
  -d '{
    "province": "Bangkok",
    "districtNumber": 1
  }'

# Create Bangkok District 2
curl -X POST http://localhost:3000/api/admin/constituency \
  -H "Content-Type: application/json" \
  -d '{
    "province": "Bangkok",
    "districtNumber": 2
  }'
```

### Step 2: Register Users (Voters)

```bash
# Register Voter 1
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890001",
    "name": "Somchai",
    "surname": "Jai",
    "address": "123 Sukhumvit Rd",
    "province": "Bangkok",
    "districtNumber": 1
  }'

# Register Voter 2
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890002",
    "name": "Somying",
    "surname": "Dee",
    "address": "456 Silom Rd",
    "province": "Bangkok",
    "districtNumber": 1
  }'

# Register EC User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "9999999999999",
    "name": "Admin",
    "surname": "User",
    "address": "Government House",
    "province": "Bangkok",
    "districtNumber": 1
  }'
```

### Step 3: Admin Promotes User to EC

```bash
# Promote user ID 3 to EC (adjust ID based on your data)
curl -X PATCH http://localhost:3000/api/admin/promote-ec/3
```

### Step 4: EC Creates Parties

```bash
# Create Party 1
curl -X POST http://localhost:3000/api/election/party \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Progressive Party",
    "logoUrl": "https://example.com/progressive-logo.png",
    "policy": "We fight for social equality and economic development"
  }'

# Create Party 2
curl -X POST http://localhost:3000/api/election/party \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conservative Party",
    "logoUrl": "https://example.com/conservative-logo.png",
    "policy": "Traditional values and economic stability"
  }'
```

### Step 5: EC Adds Candidates

```bash
# Add Candidate 1 to Bangkok District 1
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 1,
    "title": "Mr.",
    "firstName": "Thanawat",
    "lastName": "Pongpan",
    "imageUrl": "https://example.com/candidate1.jpg",
    "policy": "Better healthcare for all citizens",
    "partyId": 1,
    "constituencyId": 1
  }'

# Add Candidate 2 to Bangkok District 1
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 2,
    "title": "Ms.",
    "firstName": "Supaporn",
    "lastName": "Kaewta",
    "imageUrl": "https://example.com/candidate2.jpg",
    "policy": "Education reform and job creation",
    "partyId": 2,
    "constituencyId": 1
  }'

# Add Candidate 3 to Bangkok District 1
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 3,
    "title": "Dr.",
    "firstName": "Preecha",
    "lastName": "Wongsawat",
    "imageUrl": "https://example.com/candidate3.jpg",
    "policy": "Environmental protection and sustainable development",
    "partyId": 1,
    "constituencyId": 1
  }'
```

### Step 6: Voters Get Their Ballots

```bash
# User ID 1 gets ballot
curl http://localhost:3000/api/votes/ballot/1

# User ID 2 gets ballot
curl http://localhost:3000/api/votes/ballot/2
```

### Step 7: Voters Cast Votes

```bash
# User 1 votes for Candidate 1
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "candidateId": 1
  }'

# User 2 votes for Candidate 2
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "candidateId": 2
  }'
```

### Step 8: View Results While Poll is Open (Votes Hidden)

```bash
# View constituency 1 results (voteCount will be null)
curl http://localhost:3000/api/election/constituency/1

# View party overview (totalElectedMPs will be 0 since no polls closed)
curl http://localhost:3000/api/election/party-overview
```

### Step 9: EC Closes the Poll

```bash
# Close constituency 1
curl -X PATCH http://localhost:3000/api/election/close/1
```

### Step 10: View Results After Poll is Closed (Votes Visible)

```bash
# View constituency 1 results (voteCount will show actual numbers)
curl http://localhost:3000/api/election/constituency/1

# View party overview (totalElectedMPs will show winners)
curl http://localhost:3000/api/election/party-overview
```

### Step 11: Test Vote Change (Before Poll Closes)

```bash
# First, create a new constituency that's still open
curl -X POST http://localhost:3000/api/admin/constituency \
  -H "Content-Type: application/json" \
  -d '{
    "province": "Chiang Mai",
    "districtNumber": 1
  }'

# Register a voter in that constituency
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890099",
    "name": "Nopparat",
    "surname": "Srisuk",
    "address": "789 Chiang Mai Rd",
    "province": "Chiang Mai",
    "districtNumber": 1
  }'

# Add candidates to Chiang Mai District 1
# (Repeat candidate creation with constituencyId for the new constituency)

# User votes for Candidate A
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 4,
    "candidateId": 4
  }'

# User changes vote to Candidate B (upsert will update)
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 4,
    "candidateId": 5
  }'
```

### Step 12: Test Error Cases

```bash
# Try to vote in a closed constituency (should fail)
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "candidateId": 1
  }'

# Try to add candidate with non-existent party (should fail)
curl -X POST http://localhost:3000/api/election/candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateNumber": 99,
    "firstName": "Test",
    "lastName": "Test",
    "partyId": 999,
    "constituencyId": 1
  }'

# Try to vote for candidate in different constituency (should fail)
# User in Bangkok voting for candidate in Chiang Mai
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "candidateId": 4
  }'
```

## Postman Collection Alternative

If you prefer using Postman, create requests with these details:

### Admin Endpoints

1. **Create Constituency**: POST `/api/admin/constituency`
2. **Promote to EC**: PATCH `/api/admin/promote-ec/:userId`

### Auth Endpoints

3. **Register User**: POST `/api/auth/register`

### EC Endpoints

4. **Create Party**: POST `/api/election/party`
5. **Add Candidate**: POST `/api/election/candidate`
6. **Close Poll**: PATCH `/api/election/close/:id`

### Voter Endpoints

7. **Get Ballot**: GET `/api/votes/ballot/:userId`
8. **Cast Vote**: POST `/api/votes`

### Public Endpoints

9. **View Constituency Results**: GET `/api/election/constituency/:id`
10. **View Party Overview**: GET `/api/election/party-overview`

## Expected Behaviors

### ✅ Vote Upsert Logic

- First vote: Creates a new vote record
- Second vote: Updates existing vote record
- Works only when poll is open

### ✅ Results Display Logic

- **Open Poll**: Candidate names visible, vote counts = null
- **Closed Poll**: Candidate names visible, vote counts = actual numbers

### ✅ Party Overview Logic

- Only counts winners from closed constituencies
- Each constituency contributes max 1 MP per party
- Open constituencies don't affect the count

## Troubleshooting

If you get errors:

1. Check database connection in `.env`
2. Run `npx prisma generate` to update Prisma client
3. Check if server is running on correct port
4. Verify constituency IDs, party IDs, and user IDs match your data
5. Check error messages in Thai/English for specific issues

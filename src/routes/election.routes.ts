import { Router } from "express";
import { ElectionController } from "../controllers/election.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadImage, handleMulterError } from "../middlewares/upload.middleware";

const router = Router();
const electionController = new ElectionController();

// --- EC SETUP ---

/**
 * @swagger
 * /api/election/party:
 *   post:
 *     summary: Create a new political party (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Democratic Party"
 *               logoUrl:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *               policy:
 *                 type: string
 *                 example: "Our party policy statement"
 *     responses:
 *       201:
 *         description: Party created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Party created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid input or party already exists
 *       403:
 *         description: Forbidden - EC role required
 */
router.post(
  "/party",
  authenticate,
  authorize("EC"),
  electionController.createParty,
);

/**
 * @swagger
 * /api/election/candidate:
 *   post:
 *     summary: Register a new candidate (EC only)
 *     description: Register a user as a candidate. The user must live in the specified constituency to be eligible.
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - candidateNumber
 *               - firstName
 *               - lastName
 *               - partyId
 *               - constituencyId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 5
 *                 description: The ID of the user who will become a candidate (must live in the constituency)
 *               candidateNumber:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Mr."
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/photo.jpg"
 *               policy:
 *                 type: string
 *                 example: "Policy statement"
 *               partyId:
 *                 type: integer
 *                 example: 1
 *               constituencyId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Candidate registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Candidate registered successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Invalid input - user not found, user doesn't live in constituency, party or constituency not found
 *       403:
 *         description: Forbidden - EC role required
 */
router.post(
  "/candidate",
  authenticate,
  authorize("EC"),
  electionController.addCandidate,
);

/**
 * @swagger
 * /api/election/close/{id}:
 *   patch:
 *     summary: Close a constituency poll (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID to close
 *     responses:
 *       200:
 *         description: Poll closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Poll closed successfully"
 *       400:
 *         description: Constituency not found or already closed
 *       403:
 *         description: Forbidden - EC role required
 */
router.patch(
  "/close/:id",
  authenticate,
  authorize("EC"),
  electionController.closePoll,
);

// --- PUBLIC DATA (ไม่ต้องล็อกอิน) ---

/**
 * @swagger
 * /api/election/constituency/{id}:
 *   get:
 *     summary: View candidates in a specific constituency (Public)
 *     description: If poll is open, shows candidate list only. If closed, shows candidate list with vote counts.
 *     tags: [Election]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID
 *     responses:
 *       200:
 *         description: Constituency data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     constituency:
 *                       $ref: '#/components/schemas/Constituency'
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           party:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                           voteCount:
 *                             type: integer
 *                             description: Only present when poll is closed
 *       404:
 *         description: Constituency not found
 */
router.get("/constituency/:id", electionController.getConstituencyData);

/**
 * @swagger
 * /api/election/party-overview:
 *   get:
 *     summary: View all parties and their elected MP count (Public)
 *     description: Shows all parties with count of their MPs elected in closed constituencies
 *     tags: [Election]
 *     responses:
 *       200:
 *         description: Party overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Democratic Party"
 *                       mpCount:
 *                         type: integer
 *                         example: 5
 *                         description: Number of elected MPs from closed constituencies
 */
router.get("/party-overview", electionController.getPartyOverview);

/**
 * @swagger
 * /api/election/constituencies:
 *   get:
 *     summary: Get all constituencies or filter by province (Public)
 *     description: Returns list of all constituencies. Can be filtered by province using query parameter.
 *     tags: [Election]
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *         description: Filter constituencies by province name
 *         example: Bangkok
 *     responses:
 *       200:
 *         description: Constituencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       province:
 *                         type: string
 *                         example: "Bangkok"
 *                       districtNumber:
 *                         type: integer
 *                         example: 1
 *                       isClosed:
 *                         type: boolean
 *                         example: false
 */
router.get("/constituencies", electionController.getAllConstituencies);

/**
 * @swagger
 * /api/election/public/parties:
 *   get:
 *     summary: View all parties with candidate and MP counts (Public)
 *     description: Returns all parties with their candidate counts and elected MPs count (from closed constituencies)
 *     tags: [Election]
 *     responses:
 *       200:
 *         description: Parties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Democratic Party"
 *                       logoUrl:
 *                         type: string
 *                         example: "https://example.com/logo.png"
 *                       policy:
 *                         type: string
 *                         example: "Party policy statement"
 *                       totalCandidates:
 *                         type: integer
 *                         example: 10
 *                         description: Total candidates registered for this party
 *                       totalElectedMPs:
 *                         type: integer
 *                         example: 3
 *                         description: Number of elected MPs from closed constituencies
 */
router.get("/public/parties", electionController.getPublicPartyList);

/**
 * @swagger
 * /api/election/public/party/{id}:
 *   get:
 *     summary: View party details with all candidates (Public)
 *     description: Returns party information along with all candidates, their constituencies, and election status
 *     tags: [Election]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Democratic Party"
 *                     logoUrl:
 *                       type: string
 *                       example: "https://example.com/logo.png"
 *                     policy:
 *                       type: string
 *                       example: "Party policy statement"
 *                     totalCandidates:
 *                       type: integer
 *                       example: 10
 *                     totalElectedMPs:
 *                       type: integer
 *                       example: 3
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           candidateNumber:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                           constituency:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               province:
 *                                 type: string
 *                               districtNumber:
 *                                 type: integer
 *                               isClosed:
 *                                 type: boolean
 *                           voteCount:
 *                             type: integer
 *                             nullable: true
 *                             description: Only present when constituency is closed
 *                           isElected:
 *                             type: boolean
 *                             description: Whether this candidate won in their constituency
 *       404:
 *         description: Party not found
 */
router.get("/public/party/:id", electionController.getPublicPartyDetails);

// --- EC PARTY MANAGEMENT ---

/**
 * @swagger
 * /api/election/parties:
 *   get:
 *     summary: Get all parties (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Party'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/parties",
  authenticate,
  authorize("EC"),
  electionController.getAllParties,
);

/**
 * @swagger
 * /api/election/party/{id}:
 *   get:
 *     summary: Get a party by ID (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid party ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/party/:id",
  authenticate,
  authorize("EC"),
  electionController.getPartyById,
);

/**
 * @swagger
 * /api/election/party/{id}:
 *   put:
 *     summary: Update a party (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Party ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Democratic Party"
 *               logoUrl:
 *                 type: string
 *                 example: "https://example.com/new-logo.png"
 *               policy:
 *                 type: string
 *                 example: "Updated policy statement"
 *     responses:
 *       200:
 *         description: Party updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "อัปเดตพรรคสำเร็จ"
 *                 data:
 *                   $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid input or party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.put(
  "/party/:id",
  authenticate,
  authorize("EC"),
  electionController.updateParty,
);

/**
 * @swagger
 * /api/election/party/{id}:
 *   delete:
 *     summary: Delete a party (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "ลบพรรคสำเร็จ"
 *       400:
 *         description: Invalid party ID or party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.delete(
  "/party/:id",
  authenticate,
  authorize("EC"),
  electionController.deleteParty,
);

// --- EC CANDIDATE MANAGEMENT ---

/**
 * @swagger
 * /api/election/voters:
 *   get:
 *     summary: Get eligible voters with candidate info (EC only)
 *     description: Get voters filtered by constituencyId or province with their candidate registration status
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: constituencyId
 *         schema:
 *           type: integer
 *         description: Filter by constituency ID
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *         description: Filter by province name
 *     responses:
 *       200:
 *         description: Voters retrieved successfully
 *       400:
 *         description: Must specify constituencyId or province
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/voters",
  authenticate,
  authorize("EC"),
  electionController.getEligibleVoters,
);

/**
 * @swagger
 * /api/election/candidates:
 *   get:
 *     summary: Get all candidates or filter by constituency (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: constituencyId
 *         schema:
 *           type: integer
 *         description: Filter by constituency ID
 *     responses:
 *       200:
 *         description: Candidates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/candidates",
  authenticate,
  authorize("EC"),
  electionController.getCandidates,
);

/**
 * @swagger
 * /api/election/candidate/{id}:
 *   get:
 *     summary: Get a candidate by ID (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: Candidate retrieved successfully
 *       400:
 *         description: Invalid candidate ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/candidate/:id",
  authenticate,
  authorize("EC"),
  electionController.getCandidateById,
);

/**
 * @swagger
 * /api/election/candidate/{id}:
 *   put:
 *     summary: Update a candidate (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Candidate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateNumber:
 *                 type: integer
 *               title:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               policy:
 *                 type: string
 *               partyId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *       400:
 *         description: Invalid input or candidate not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.put(
  "/candidate/:id",
  authenticate,
  authorize("EC"),
  electionController.updateCandidate,
);

/**
 * @swagger
 * /api/election/candidate/{id}:
 *   delete:
 *     summary: Delete a candidate (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: Candidate deleted successfully
 *       400:
 *         description: Invalid candidate ID or candidate not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.delete(
  "/candidate/:id",
  authenticate,
  authorize("EC"),
  electionController.deleteCandidate,
);

/**
 * @swagger
 * /api/election/next-candidate-number/{constituencyId}:
 *   get:
 *     summary: Get next available candidate number in constituency (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: constituencyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Constituency ID
 *     responses:
 *       200:
 *         description: Next candidate number retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     nextCandidateNumber:
 *                       type: integer
 *       400:
 *         description: Invalid constituency ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/next-candidate-number/:constituencyId",
  authenticate,
  authorize("EC"),
  electionController.getNextCandidateNumber,
);

/**
 * @swagger
 * /api/election/provinces:
 *   get:
 *     summary: Get all provinces with constituencies (EC only)
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provinces retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - EC role required
 */
router.get(
  "/provinces",
  authenticate,
  authorize("EC"),
  electionController.getAllProvinces,
);

// --- EC UPLOAD ---

/**
 * @swagger
 * /api/election/party/{id}/logo:
 *   post:
 *     summary: Upload party logo (EC only)
 *     description: Upload a logo for a political party. Image is stored in Supabase Storage. Max file size is 5MB. Accepted formats are jpg, jpeg, png, gif, webp.
 *     tags: [Election]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Party ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file to upload (max 5MB, jpg/png/gif/webp)
 *     responses:
 *       200:
 *         description: Party logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "อัปโหลดโลโก้พรรคสำเร็จ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Democratic Party"
 *                     logoUrl:
 *                       type: string
 *                       example: "https://xxx.supabase.co/storage/v1/object/public/image/parties/uuid.png"
 *       400:
 *         description: Invalid file, no file uploaded, or party not found
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - EC role required
 */
router.post(
  "/party/:id/logo",
  authenticate,
  authorize("EC"),
  uploadImage,
  handleMulterError,
  electionController.uploadPartyLogo,
);

export default router;

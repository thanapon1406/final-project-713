import { Router } from "express";
import { ElectionController } from "../controllers/election.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

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

export default router;

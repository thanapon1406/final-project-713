// src/routes/vote.routes.ts
import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const voteController = new VoteController();

/**
 * @swagger
 * /api/votes/ballot:
 *   get:
 *     summary: Get ballot (list of candidates) for the logged-in user
 *     description: Returns the ballot for the user's constituency. User ID is taken from the JWT token.
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ballot retrieved successfully
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
 *                           candidateNumber:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           party:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       400:
 *         description: User not found or not assigned to a constituency
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - VOTER or EC role required
 */
router.get(
  "/ballot",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getBallot,
);

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Cast or update a vote
 *     description: Allows a voter or EC to cast a vote or change their existing vote (if constituency is still open). User ID is taken from the JWT token.
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateId
 *             properties:
 *               candidateId:
 *                 type: integer
 *                 example: 1
 *                 description: The ID of the candidate to vote for
 *     responses:
 *       200:
 *         description: Vote cast or updated successfully
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
 *                   example: "Vote cast successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Vote'
 *       400:
 *         description: Invalid input, constituency closed, or candidate not in user's constituency
 *       401:
 *         description: Unauthorized - Please login
 *       403:
 *         description: Forbidden - VOTER or EC role required
 */
router.post("/", authenticate, authorize("VOTER", "EC"), voteController.vote);

export default router;

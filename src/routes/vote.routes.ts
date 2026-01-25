// src/routes/vote.routes.ts
import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const voteController = new VoteController();

// ทุก route ต้องล็อกอินและเป็น VOTER เท่านั้น

/**
 * @swagger
 * /api/votes/ballot/{userId}:
 *   get:
 *     summary: Get ballot (list of candidates) for a specific user
 *     tags: [Vote]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get ballot for
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
 *                           name:
 *                             type: string
 *                           party:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *       400:
 *         description: User not found or not assigned to a constituency
 *       403:
 *         description: Forbidden - Voter role required
 */
router.get(
  "/ballot/:userId",
  authenticate,
  authorize("VOTER"),
  voteController.getBallot,
);

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Cast or update a vote
 *     description: Allows a voter to cast a vote or change their existing vote (if constituency is still open)
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
 *               - userId
 *               - candidateId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               candidateId:
 *                 type: integer
 *                 example: 1
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
 *       403:
 *         description: Forbidden - Voter role required
 */
router.post("/", authenticate, authorize("VOTER"), voteController.vote);

export default router;
